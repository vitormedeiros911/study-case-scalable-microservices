import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';

import { cluster } from '../cluster';
import { ordersDockerImage } from '../images/orders';
import { appLoadBalancer } from '../load-balancer';
import { amqpListener } from './rabbitmq';

const ordersAdminTargetGroup = appLoadBalancer.createTargetGroup('orders-target', {
    port: 3333,
    protocol: 'HTTP',
    healthCheck: {
        path: '/health',
        protocol: 'HTTP',
    },
});

export const ordersAdminHttpListener = appLoadBalancer.createListener('orders-http-listener', {
    port: 3333,
    protocol: 'HTTP',
    targetGroup: ordersAdminTargetGroup,
});


export const ordersService =  new awsx.classic.ecs.FargateService('fargate-orders', {
    cluster,
    desiredCount: 1,
    waitForSteadyState: false,
    taskDefinitionArgs: {
        container: {
            image: ordersDockerImage.ref,
            cpu: 256,
            memory: 512,
            portMappings: [ordersAdminHttpListener],
            environment: [
                {
                    name: "BROKER_URL",
                    value: pulumi.interpolate`amqp://admin:admin@${amqpListener.endpoint.hostname}:${amqpListener.endpoint.port}`
                },
                {
                    name: 'DATABASE_URL',
                    value: 'postgresql://neondb_owner:npg_LBY3KIJVDzc1@ep-calm-water-a4sbsjdb.us-east-1.aws.neon.tech/orders?sslmode=require&channel_binding=require'
                },
                {
                    name: 'OTEL_SERVICE_NAME',
                    value: 'orders'
                },
                {
                    name: 'OTEL_TRACES_EXPORTER',
                    value: 'otlp'
                },
                {
                    name: 'OTEL_EXPORTER_OTLP_ENDPOINT',
                    value: "https://otlp-gateway-prod-sa-east-1.grafana.net/otlp"
                },
                {
                    name: 'OTEL_EXPORTER_OTLP_HEADERS',
                    value: "Authorization=Basic MTQ4MzAyMjpnbGNfZXlKdklqb2lNVFl6TURJek5DSXNJbTRpT2lKbGRtVnVkRzh0Ym05a1pXcHpJaXdpYXlJNklqaDNjV1ZTVlc0ME1XczBRMlk0T0c4eFMwYzVhV0kwTUNJc0ltMGlPbnNpY2lJNkluQnliMlF0YzJFdFpXRnpkQzB4SW4xOQ=="
                },
                {
                    name: 'OTEL_RESOURCE_ATTRIBUTES',
                    value: 'service.name=orders,service.namespace=evento-nodejs,deployment.environment=production'
                },
                {
                    name: 'OTEL_NODE_RESOURCE_DETECTORS',
                    value: 'env,host,os'
                },
                {
                    name: 'OTEL_NODE_ENABLED_INSTRUMENTATIONS',
                    value: 'http,fastify,pg,amqplib'
                }
            ]
        }
    }
});