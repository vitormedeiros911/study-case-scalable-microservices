import { fastifyCors } from '@fastify/cors';
import { fastify } from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { dispatchOrderCreated } from '../broker/messages/order-created.ts';
import { dbClient } from '../db/client.ts';
import { schema } from '../db/schema/index.ts';

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

    dispatchOrderCreated({
      orderId,
      amount,
      customer:  {
        id: 'ad519e68-c51e-4aa4-a61e-b633f8bc7d66',
      },
    });
    
    try {
      await dbClient.insert(schema.orders).values({ 
        id: randomUUID(),
        customerId: 'ad519e68-c51e-4aa4-a61e-b633f8bc7d66',
        amount,
      });

      return res.status(201).send()
    } catch (error) {
      console.error('Error inserting order:', error);
    }
})

app.listen({ host: '0.0.0.0', port: 3333 }).then(() => {
    console.log('[Orders] HTTP server running');
})