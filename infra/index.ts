import * as pulumi from '@pulumi/pulumi';

import { appLoadBalancer } from './src/load-balancer';
import { ordersService } from './src/services/orders';
import { rabbitMQService } from './src/services/rabbitmq';

export const ordersId = ordersService.service.id;
export const rabbitMqId = rabbitMQService.service.id;
export const rabbitMQAdminURL = pulumi.interpolate`http://${appLoadBalancer.listeners[0].endpoint.hostname}:15672`;