import { Notice } from '@/prisma-client'

// Edição parcial: `undefined` = mantém; campos providos sobrescrevem.
export interface INoticeUpdateInput {
	title?: string
	category?: string
}

export interface INoticesRepository {
	list(): Promise<Notice[]>
	create(data: { title: string; category: string }): Promise<Notice>
	findById(id: string): Promise<Notice | null>
	update(id: string, data: INoticeUpdateInput): Promise<Notice>
	delete(id: string): Promise<void>
}
