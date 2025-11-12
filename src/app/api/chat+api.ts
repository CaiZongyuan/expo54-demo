import {
    convertToModelMessages,
    stepCountIs,
    streamText,
    UIMessage
} from 'ai';
import { customAgent } from '../../providers/custom-agent-provid';

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
        model: customAgent('qwen3:8b'),
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse({
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'none',
        },
    });
}