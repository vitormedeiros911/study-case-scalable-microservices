import '@opentelemetry/auto-instrumentations-node/register';

import { fastifyCors } from '@fastify/cors';
import { trace } from '@opentelemetry/api';
import { fastify } from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { setTimeout } from 'node:timers/promises';

import { dispatchOrderCreated } from '../broker/messages/order-created.ts';
import { dbClient } from '../db/client.ts';
import { schema } from '../db/schema/index.ts';
import { tracer } from '../tracer/tracer.ts';

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, {
    origin: true,
});

app.get('/health', async (req, res) => {
    return res.status(200).send({ status: 'OK' });
})

app.post('/orders', {
    schema: {
        body: z.object({
            amount: z.coerce.number(),
        })
    }
}, async (req, res) => {
    const { amount } = req.body;

    console.log(`Received order for amount: ${amount}`);

    const orderId = randomUUID();
  
    await dbClient.insert(schema.orders).values({ 
      id: randomUUID(),
      customerId: 'ad519e68-c51e-4aa4-a61e-b633f8bc7d66',
      amount,
    });

    const span = tracer.startSpan('process order')

    span.setAttribute('teste_attribute', 'order_processing');

    await setTimeout(2000);

    span.end();
      
    trace.getActiveSpan()?.setAttribute('order_id', orderId);
    
    dispatchOrderCreated({
      orderId,
      amount,
      customer:  {
        id: 'ad519e68-c51e-4aa4-a61e-b633f8bc7d66',
      },
    });

    return res.status(201).send()
})

app.listen({ host: '0.0.0.0', port: 3333 }).then(() => {
    console.log('[Orders] HTTP server running');
})