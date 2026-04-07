import { createClient } from './client.js';
export async function getTaskComments(taskId) {
    const client = createClient();
    const res = await client.get(`/task/${taskId}/comment`);
    return res.data.comments;
}
export async function postComment(taskId, text) {
    const client = createClient();
    await client.post(`/task/${taskId}/comment`, {
        comment_text: text,
        notify_all: false,
    });
}
