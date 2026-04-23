//Return the output of a workflow once it's complete, or throw an error if it fails
export async function pollWorkflow<T>(instance: any): Promise<T>;
export async function pollWorkflow<T, K extends keyof T>(instance: any, fields: K[]): Promise<Pick<T, K>>;
export async function pollWorkflow<T, K extends keyof T>(instance: any, fields?: K[]): Promise<T | Pick<T, K>> {
	while (true) {
		const status = await instance.status();
		if (status.status === 'complete') {
			const output = status.output as T;

			if (!fields || fields.length === 0) {
				return output;
			}

			return fields.reduce(
				(acc, field) => {
					acc[field] = output[field];
					return acc;
				},
				{} as Pick<T, K>,
			);
		} else if (status.status === 'errored') {
			throw new Error('Workflow failed');
		}
		await new Promise((r) => setTimeout(r, 500));
	}
}
