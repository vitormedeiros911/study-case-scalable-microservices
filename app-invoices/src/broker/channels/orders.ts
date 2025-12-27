import { brokerClient } from '../client.ts'

export const orders = await brokerClient.createChannel()

await orders.assertQueue('orders')