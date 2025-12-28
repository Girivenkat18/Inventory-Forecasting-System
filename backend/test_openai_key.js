require('dotenv').config();
const OpenAI = require('openai');

const testKey = async () => {
    console.log('--- Testing OpenAI Key ---');
    if (!process.env.OPENAI_API_KEY) {
        console.error('ERROR: OPENAI_API_KEY is missing in .env');
        return;
    }

    console.log(`Key present: ${process.env.OPENAI_API_KEY.substring(0, 15)}...`);

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });


    try {
        console.log('Attempting to list models...');
        // const list = await openai.models.list();
        // console.log('SUCCESS: Connection successful. Models available:', list.data.length);

        console.log('Attempting a small chat completion...');
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Hello" }],
            model: "gpt-3.5-turbo",
        });
        console.log('SUCCESS: Chat completion worked!', completion.choices[0].message.content);

    } catch (error) {

        console.error('FAILURE: OpenAI API Error');
        console.error(`Status: ${error.status}`);
        console.error(`Message: ${error.message}`);
        console.error(`Code: ${error.code}`);
        console.error(`Type: ${error.type}`);
    }
};

testKey();
