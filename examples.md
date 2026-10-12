// 1) Send a message to a channel using Components v2
// POST /channels/{channel.id}/messages

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = '...';

const url = `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`;

const body = {
  content: 'Open a chest or use the forge!',
  components: [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 1,
          label: 'Open Chest',
          custom_id: 'open_chest:btn_1'
        },
        {
          type: 2,
          style: 2,
          label: 'Go to Forge',
          custom_id: 'open_forge:btn_1'
        }
      ]
    }
  ],
  flags: 32768
};

await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bot ${BOT_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
});

console.log('Message sent with Components v2 flag');


// 2) Reply to an interaction with an ephemeral components v2 response
// POST /interactions/{interaction.id}/{interaction.token}/callback

const INTERACTION_ID = '...';
const INTERACTION_TOKEN = '...';

const replyUrl = `https://discord.com/api/v10/interactions/${INTERACTION_ID}/${INTERACTION_TOKEN}/callback`;

const interactionResponse = {
  type: 4,
  data: {
    content: 'Here is a private panel for you',
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 1,
            label: 'Claim Reward',
            custom_id: 'claim_reward:btn_1'
          }
        ]
      }
    ],
    flags: 32832
  }
};

await fetch(replyUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(interactionResponse)
});

console.log('Interaction replied with ephemeral components v2');


// 3) Update an existing message to switch to Components v2
// PATCH /channels/{channel.id}/messages/{message.id}

const MESSAGE_ID = '...';

const updateUrl = `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages/${MESSAGE_ID}`;

const updatedBody = {
  content: 'Updated panel — forge is ready',
  components: [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 3,
          label: 'Start Forge',
          custom_id: 'start_forge:btn_1'
        }
      ]
    }
  ],
  flags: 32768
};

await fetch(updateUrl, {
  method: 'PATCH',
  headers: {
    Authorization: `Bot ${BOT_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updatedBody)
});

console.log('Message updated to Components v2');


// 4) Example interaction responder for component clicks

import http from 'http';

http.createServer(async (req, res) => {
  if (req.method !== 'POST') return res.end('OK');

  let body = '';
  for await (const chunk of req) body += chunk;
  const payload = JSON.parse(body);

  if (payload.type === 3) {
    const customId = payload.data.custom_id;

    const callbackUrl = `https://discord.com/api/v10/interactions/${payload.id}/${payload.token}/callback`;

    const response = {
      type: 4,
      data: {
        content: `You pressed: ${customId}`,
        flags: 64
      }
    };

    await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response)
    });
  }

  res.writeHead(200);
  res.end();
}).listen(3000);

console.log('Interaction handler running on :3000');


// 5) Notes and best practices

// - Always use numeric flag values.
// - To combine flags, add them: 32768 + 64 = 32832.
// - Verify interaction requests using your app public key before processing.
// - Keep tokens in environment variables.
// - Test in a staging guild before production.