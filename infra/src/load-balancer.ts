import * as awsx from '@pulumi/awsx';
import { cluster } from './cluster';

export const appLoadBalancer = new awsx.classic.lb.ApplicationLoadBalancer('app-lb', {
    securityGroups: cluster.securityGroups,
});

export const networkLoadBalancer = new awsx.classic.lb.NetworkLoadBalancer('app-nlb', {
    subnets: cluster.vpc.publicSubnetIds,
});