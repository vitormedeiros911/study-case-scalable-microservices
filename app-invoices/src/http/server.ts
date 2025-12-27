import '../broker/subscriber.ts'

import { fastifyCors } from '@fastify/cors';
import { fastify } from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, {
    origin: true,
});

app.get('/health', async (req, res) => {
    return res.status(200).send({ status: 'OK' });
})

app.listen({ host: '0.0.0.0', port: 3334 }).then(() => {
    console.log('[Invoices] HTTP server running');
})