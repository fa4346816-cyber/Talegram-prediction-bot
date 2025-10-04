const { Telegraf } = require('telegraf');
const express = require('express');
const cron = require('node-cron');
const axios = require('axios');

const app = express();

// Environment variables (set in Railway dashboard)
const BOT_TOKEN = process.env.BOT_TOKEN || '8405308648:AAEb-2OAGR0EmTaitH29RsjdRSJR_OoNWuM';
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}/webhook` : null;

const bot = new Telegraf(BOT_TOKEN);

// Admin configuration
const adminSettings = {
    password: 'admin123',
    channels: [],
    autoPredict: false,
    autoTime: '*/5 * * * *',
    webhookUrl: WEBHOOK_URL
};

const userAccess = new Map();
let botStartTime = new Date();

// Prediction generator
function generatePrediction() {
    const colors = ["🔴 RED", "🟢 GREEN", "🟣 VIOLET"];
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const number = numbers[Math.floor(Math.random() * numbers.length)];
    const size = number <= 4 ? "Small" : "Big";
    const confidence = ["🔥 High (92%)", "⚡ Medium (85%)", "✅ Good (80%)"][Math.floor(Math.random() * 3)];
    const period = Date.now().toString().slice(-8);
    
    return { 
        color, 
        number, 
        size, 
        confidence, 
        period, 
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now()
    };
}

// Access control
function hasAccess(userId) {
    return userAccess.has(userId);
}

function addAccess(userId) {
    userAccess.set(userId, {
        grantedAt: new Date(),
        accessCount: (userAccess.get(userId)?.accessCount || 0) + 1
    });
}

// Bot commands
bot.start((ctx) => {
    const userId = ctx.from.id;
    
    if (!hasAccess(userId)) {
        return ctx.replyWithMarkdown(
            `🔒 *PREDICTION MASTER BOT* 🔒\n\n` +
            `*Premium Access Required* ⚡\n\n` +
            `Enter access key to continue:`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🔑 Enter Access Key", callback_data: "enter_key" }],
                        [{ text: "ℹ️ About Bot", callback_data: "about_bot" }]
                    ]
                }
            }
        );
    }
    showMainMenu(ctx);
});

bot.action('enter_key', async (ctx) => {
    await ctx.editMessageText(
        `🔑 *ACCESS VERIFICATION*\n\n` +
        `Please send the access key:\n\n` +
        `💡 *Contact admin for access key*`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Cancel", callback_data: "cancel_key" }]
                ]
            }
        }
    );
});

bot.action('about_bot', async (ctx) => {
    await ctx.editMessageText(
        `🤖 *PREDICTION MASTER BOT* ⚡\n\n` +
        `*Advanced Prediction System*\n\n` +
        `✨ *Features:*\n` +
        `• 🎯 Smart Predictions\n` +
        `• ⏰ Auto Scheduling\n` +
        `• 📊 Live Statistics\n` +
        `• 🔐 Secure Access\n` +
        `• 👑 Admin Control\n\n` +
        `🔒 *Access Key Required*`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔑 Get Access", callback_data: "enter_key" }],
                    [{ text: "⬅️ Back", callback_data: "cancel_key" }]
                ]
            }
        }
    );
});

// Text message handler for access key
bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id;

    if (text === adminSettings.password) {
        addAccess(userId);
        await ctx.replyWithMarkdown(
            `✅ *ACCESS GRANTED!* 🎉\n\n` +
            `Welcome to *Prediction Master* 👑\n\n` +
            `You now have full access to all features!`
        );
        showMainMenu(ctx);
    } else if (!text.startsWith('/')) {
        await ctx.replyWithMarkdown(
            `❌ *INVALID ACCESS KEY*\n\n` +
            `Please check the key and try again.\n\n` +
            `💡 Contact administrator for valid access key.`
        );
    }
});

// Main menu
function showMainMenu(ctx) {
    ctx.replyWithMarkdown(
        `🎯 *PREDICTION MASTER* ⚡\n\n` +
        `*Welcome Admin!* 👑\n\n` +
        `🔄 *Auto Predict:* ${adminSettings.autoPredict ? '🟢 ON' : '🔴 OFF'}\n` +
        `⏰ *Schedule:* ${adminSettings.autoTime}\n` +
        `👥 *Users:* ${userAccess.size}\n` +
        `🕒 *Uptime:* ${Math.round((Date.now() - botStartTime) / 3600000)}h`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "⚡ Prediction ON", callback_data: "prediction_on" },
                        { text: "🚫 Prediction OFF", callback_data: "prediction_off" }
                    ],
                    [
                        { text: "⏰ Auto Settings", callback_data: "set_auto_time" },
                        { text: "📢 Channels", callback_data: "add_channel" }
                    ],
                    [
                        { text: "👥 Manage Access", callback_data: "manage_access" },
                        { text: "📊 Statistics", callback_data: "statistics" }
                    ],
                    [
                        { text: "🔄 Refresh", callback_data: "main_menu" }
                    ]
                ]
            }
        }
    );
}

// Prediction ON
bot.action('prediction_on', async (ctx) => {
    const prediction = generatePrediction();
    const message = 
        `🎯 *PREDICTION ACTIVATED* ⚡\n` +
        `┌─────────────────────\n` +
        `│ 🕒 Time: ${prediction.time}\n` +
        `│ 🆔 Period: ${prediction.period}\n` +
        `│ ────────────────────\n` +
        `│ 🎨 Color: ${prediction.color}\n` +
        `│ 🔢 Number: ${prediction.number} (${prediction.size})\n` +
        `│ 📊 Confidence: ${prediction.confidence}\n` +
        `│ 👑 Admin Controlled\n` +
        `└─────────────────────\n\n` +
        `💡 *Prediction System: 🟢 ACTIVE*`;

    await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🔄 New Prediction", callback_data: "prediction_on" },
                    { text: "🚫 Stop", callback_data: "prediction_off" }
                ],
                [
                    { text: "⏰ Auto Settings", callback_data: "set_auto_time" },
                    { text: "📊 Stats", callback_data: "statistics" }
                ],
                [
                    { text: "⬅️ Main Menu", callback_data: "main_menu" }
                ]
            ]
        }
    });
});

// Prediction OFF
bot.action('prediction_off', async (ctx) => {
    await ctx.editMessageText(
        `🚫 *PREDICTION STOPPED*\n\n` +
        `Prediction system has been disabled.\n\n` +
        `💡 *Status:* 🔴 INACTIVE\n` +
        `👑 *Admin Control Only*`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "⚡ Start Prediction", callback_data: "prediction_on" }],
                    [{ text: "⬅️ Main Menu", callback_data: "main_menu" }]
                ]
            }
        }
    );
});

// Auto prediction settings
bot.action('set_auto_time', async (ctx) => {
    await ctx.editMessageText(
        `⏰ *AUTO PREDICTION SETTINGS*\n\n` +
        `*Current Schedule:* \`${adminSettings.autoTime}\`\n` +
        `*Status:* ${adminSettings.autoPredict ? '🟢 ON' : '🔴 OFF'}\n\n` +
        `💡 *Set automatic prediction timing:*`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔄 Every 5 Min", callback_data: "set_time_5min" },
                        { text: "🔄 Every 10 Min", callback_data: "set_time_10min" }
                    ],
                    [
                        { text: "🔄 Every 30 Min", callback_data: "set_time_30min" },
                        { text: "🔄 Every Hour", callback_data: "set_time_1hour" }
                    ],
                    [
                        { text: adminSettings.autoPredict ? "🔴 Auto OFF" : "🟢 Auto ON", callback_data: "toggle_auto" }
                    ],
                    [
                        { text: "⬅️ Main Menu", callback_data: "main_menu" }
                    ]
                ]
            }
        }
    );
});

// Time settings
bot.action('set_time_5min', async (ctx) => {
    adminSettings.autoTime = '*/5 * * * *';
    await ctx.answerCbQuery('✅ Auto prediction set: Every 5 minutes');
    bot.action('set_auto_time')(ctx);
});

bot.action('set_time_10min', async (ctx) => {
    adminSettings.autoTime = '*/10 * * * *';
    await ctx.answerCbQuery('✅ Auto prediction set: Every 10 minutes');
    bot.action('set_auto_time')(ctx);
});

bot.action('set_time_30min', async (ctx) => {
    adminSettings.autoTime = '*/30 * * * *';
    await ctx.answerCbQuery('✅ Auto prediction set: Every 30 minutes');
    bot.action('set_auto_time')(ctx);
});

bot.action('set_time_1hour', async (ctx) => {
    adminSettings.autoTime = '0 */1 * * *';
    await ctx.answerCbQuery('✅ Auto prediction set: Every hour');
    bot.action('set_auto_time')(ctx);
});

// Toggle auto prediction
bot.action('toggle_auto', async (ctx) => {
    adminSettings.autoPredict = !adminSettings.autoPredict;
    
    if (adminSettings.autoPredict) {
        // Start cron job
        cron.schedule(adminSettings.autoTime, () => {
            console.log('🔄 Auto prediction triggered at:', new Date().toISOString());
        });
        await ctx.answerCbQuery('✅ Auto prediction: ON');
    } else {
        await ctx.answerCbQuery('✅ Auto prediction: OFF');
    }
    
    bot.action('set_auto_time')(ctx);
});

// Channel management
bot.action('add_channel', async (ctx) => {
    await ctx.editMessageText(
        `📢 *CHANNEL MANAGEMENT*\n\n` +
        `*Setup Instructions:*\n\n` +
        `1. Add @${ctx.botInfo.username} as administrator\n` +
        `2. Give posting permissions\n` +
        `3. Send /connect command in channel\n` +
        `4. Or forward channel message here\n\n` +
        `💡 *Currently connected:* ${adminSettings.channels.length} channels`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "👥 Manage Access Keys", callback_data: "manage_access" }],
                    [{ text: "⬅️ Main Menu", callback_data: "main_menu" }]
                ]
            }
        }
    );
});

// Access management
bot.action('manage_access', async (ctx) => {
    await ctx.editMessageText(
        `👥 *ACCESS MANAGEMENT*\n\n` +
        `🔑 *Current Access Key:* \`${adminSettings.password}\`\n` +
        `👤 *Active Users:* ${userAccess.size}\n\n` +
        `*Management Options:*`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔑 Generate New Key", callback_data: "change_key" }],
                    [{ text: "📊 View Users", callback_data: "view_users" }],
                    [{ text: "🔄 Reset All Access", callback_data: "reset_access" }],
                    [{ text: "⬅️ Main Menu", callback_data: "main_menu" }]
                ]
            }
        }
    );
});

// Change access key
bot.action('change_key', async (ctx) => {
    const newKey = Math.random().toString(36).substring(2, 10);
    adminSettings.password = newKey;
    userAccess.clear(); // Clear all access with old key
    
    await ctx.editMessageText(
        `🔑 *NEW ACCESS KEY GENERATED*\n\n` +
        `*New Key:* \`${newKey}\`\n\n` +
        `⚠️ *All previous access has been revoked*\n` +
        `📝 *Share this new key with users*`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "👥 Back to Access Management", callback_data: "manage_access" }],
                    [{ text: "⬅️ Main Menu", callback_data: "main_menu" }]
                ]
            }
        }
    );
});

// Statistics
bot.action('statistics', async (ctx) => {
    const uptime = Math.round((Date.now() - botStartTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    await ctx.editMessageText(
        `📊 *BOT STATISTICS* 📈\n` +
        `┌─────────────────────\n` +
        `│ 🤖 Bot Status: 🟢 ONLINE\n` +
        `│ 👑 Admin Panel: Active\n` +
        `│ 👥 Users: ${userAccess.size}\n` +
        `│ 📢 Channels: ${adminSettings.channels.length}\n` +
        `│ ────────────────────\n` +
        `│ ⚡ Predictions: Active\n` +
        `│ ⏰ Auto: ${adminSettings.autoPredict ? '🟢 ON' : '🔴 OFF'}\n` +
        `│ 🕒 Schedule: ${adminSettings.autoTime}\n` +
        `│ 🔑 Access: Key Protected\n` +
        `│ ⏱️ Uptime: ${hours}h ${minutes}m\n` +
        `└─────────────────────`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔄 Refresh Stats", callback_data: "statistics" }],
                    [{ text: "⬅️ Main Menu", callback_data: "main_menu" }]
                ]
            }
        }
    );
});

// View users
bot.action('view_users', async (ctx) => {
    const usersList = Array.from(userAccess.entries())
        .slice(0, 10)
        .map(([id, data], index) => 
            `${index + 1}. User ${id.toString().slice(-6)} - ${data.grantedAt.toLocaleDateString()}`
        )
        .join('\n');

    await ctx.editMessageText(
        `👥 *ACTIVE USERS* (${userAccess.size})\n\n` +
        (usersList || `*No active users*`) +
        `\n\n💡 *Showing latest 10 users*`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "⬅️ Back to Access", callback_data: "manage_access" }],
                    [{ text: "🔄 Refresh", callback_data: "view_users" }]
                ]
            }
        }
    );
});

// Reset access
bot.action('reset_access', async (ctx) => {
    userAccess.clear();
    await ctx.editMessageText(
        `🔄 *ALL ACCESS RESET*\n\n` +
        `✅ *All user access has been cleared!*\n\n` +
        `📝 Users will need to enter access key again.`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "⬅️ Back to Access", callback_data: "manage_access" }]
                ]
            }
        }
    );
});

// Navigation
bot.action('main_menu', async (ctx) => {
    await ctx.deleteMessage();
    showMainMenu(ctx);
});

bot.action('cancel_key', async (ctx) => {
    await ctx.deleteMessage();
    showMainMenu(ctx);
});

// Additional commands
bot.command('admin', (ctx) => {
    if (hasAccess(ctx.from.id)) {
        showMainMenu(ctx);
    } else {
        ctx.replyWithMarkdown('❌ *Admin access required!*\n\nUse /start and enter access key.');
    }
});

bot.command('startpredict', (ctx) => {
    if (hasAccess(ctx.from.id)) {
        bot.action('prediction_on')(ctx);
    }
});

bot.command('stoppredict', (ctx) => {
    if (hasAccess(ctx.from.id)) {
        bot.action('prediction_off')(ctx);
    }
});

bot.command('stats', (ctx) => {
    if (hasAccess(ctx.from.id)) {
        bot.action('statistics')(ctx);
    }
});

// Error handling
bot.catch((err, ctx) => {
    console.error('❌ Bot error:', err);
    console.error('Error context:', ctx);
});

// Express routes for health checks
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        status: '🟢 ONLINE',
        bot: 'Prediction Master',
        users: userAccess.size,
        autoPredict: adminSettings.autoPredict,
        uptime: Math.round((Date.now() - botStartTime) / 1000),
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

app.get('/stats', (req, res) => {
    res.json({
        users: userAccess.size,
        channels: adminSettings.channels.length,
        autoPredict: adminSettings.autoPredict,
        schedule: adminSettings.autoTime,
        uptime: Math.round((Date.now() - botStartTime) / 1000)
    });
});

// Webhook setup for Railway
if (WEBHOOK_URL) {
    app.use(bot.webhookCallback('/webhook'));
    bot.telegram.setWebhook(WEBHOOK_URL).then(() => {
        console.log('🌐 Webhook configured:', WEBHOOK_URL);
    });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Prediction Bot Server started!');
    console.log('📍 Port:', PORT);
    console.log('🕒 Start time:', botStartTime.toISOString());
    console.log('🔑 Default access key: admin123');
    
    if (WEBHOOK_URL) {
        console.log('🌐 Webhook URL:', WEBHOOK_URL);
    } else {
        console.log('🔵 Using long polling');
        // Start bot with long polling if no webhook
        bot.launch().then(() => {
            console.log('✅ Telegram Bot started successfully!');
        }).catch(err => {
            console.error('❌ Bot launch failed:', err);
        });
    }
});

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('🛑 Shutting down gracefully...');
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    console.log('🛑 Shutting down gracefully...');
    bot.stop('SIGTERM');
});
