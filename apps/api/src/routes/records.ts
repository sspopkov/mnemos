import { FastifyInstance } from 'fastify'
import { prisma } from '../prisma.js'

export async function recordsRoutes(app: FastifyInstance) {
    app.get('/api/records', async () => {
        return prisma.record.findMany({ orderBy: { createdAt: 'desc' } })
    })

    app.post('/api/records', async (req, reply) => {
        const body = req.body as { title: string; content?: string }
        if (!body?.title) return reply.code(400).send({ error: 'title is required' })
        const rec = await prisma.record.create({ data: { title: body.title, content: body.content ?? null } })
        return rec
    })

    app.put('/api/records/:id', async (req, reply) => {
        const { id } = req.params as { id: string }
        const body = req.body as { title?: string; content?: string | null }
        const rec = await prisma.record.update({ where: { id }, data: { ...body } })
        return rec
    })

    app.delete('/api/records/:id', async (req) => {
        const { id } = req.params as { id: string }
        await prisma.record.delete({ where: { id } })
        return { ok: true }
    })
}
