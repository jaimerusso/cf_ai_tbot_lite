//Return the output of a workflow once it's complete, or throw an error if it fails
export async function pollWorkflow<K extends string>(instance: any, fields?: K[]): Promise<Record<K, string> | string> {
	while (true) {
		const status = await instance.status();
		if (status.status === 'complete') {
			const output = status.output as Record<K, string>;

			//If only one field is expected from the workflow
			if (!fields || fields.length === 0) {
				return output as unknown as string;
			}

			return fields.reduce(
				(acc, field) => {
					acc[field] = output[field];
					return acc;
				},
				{} as Record<K, string>,
			);
		} else if (status.status === 'errored') {
			throw new Error('Workflow failed');
		}
		await new Promise((r) => setTimeout(r, 500));
	}
}
