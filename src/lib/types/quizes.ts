export interface Quiz {
	id: string;
	workspaceId: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

export interface NewQuiz {
	workspaceId: string;
	name: string;
}

export interface UpdateQuiz {
	name?: string;
}
