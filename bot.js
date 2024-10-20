require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const inventoryController = require('./controllers/inventoryController');
const projectController = require('./controllers/projectController');
const authService = require('./services/authService');  // فرض کنید authService احراز هویت کاربر را انجام می‌دهد
const dbConfig = require('./config/db');
const PORT = process.env.PORT || 3000;
const app = express();

const userSessions = {};

console.log(`MongoDB connection URI: ${dbConfig.uri}`);
mongoose.connect(dbConfig.uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);  // Exit the process if connection fails
  });

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

function loginUser(chatId) {
  if (!userSessions[chatId]) {
    userSessions[chatId] = { step: 'username' };  // شروع فرآیند لاگین
    bot.sendMessage(chatId, 'لطفاً نام کاربری خود را وارد کنید:');
  }

  bot.once('message', (msg) => {
    if (userSessions[chatId].step === 'username') {
      const username = msg.text.trim();
      userSessions[chatId].username = username;
      userSessions[chatId].step = 'password';  // تغییر به مرحله دریافت رمز عبور
      bot.sendMessage(chatId, 'لطفاً رمز عبور خود را وارد کنید:');

      bot.once('message', (msg) => {
        if (userSessions[chatId].step === 'password') {
          const password = msg.text.trim();
          const { username } = userSessions[chatId];

          authService.authenticate(username, password)
            .then(isAuthenticated => {
              if (isAuthenticated) {
                userSessions[chatId].loggedIn = true;
                bot.sendMessage(chatId, 'ورود موفقیت‌آمیز بود.');
                showMainMenu(chatId);  // نمایش منوی اصلی
              } else {
                bot.sendMessage(chatId, 'نام کاربری یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.');
                delete userSessions[chatId];  // ریست کردن وضعیت لاگین
                loginUser(chatId);  // درخواست دوباره لاگین
              }
            })
            .catch(err => {
              console.error('Error during authentication:', err);
              bot.sendMessage(chatId, 'خطایی در هنگام احراز هویت رخ داد.');
              delete userSessions[chatId];  // ریست کردن وضعیت لاگین
              loginUser(chatId);  // درخواست دوباره لاگین
            });
        }
      });
    }
  });
}

function showMainMenu(chatId) {
  const options = {
    reply_markup: {
      keyboard: [
        [{ text: 'افزودن قطعه به انبار' }],
        [{ text: 'تعریف پروژه' }],
        [{ text: 'نمایش موجودی انبار' }],
        [{ text: 'لیست پروژه‌ها' }],
        [{ text: 'ویرایش قطعات بر اساس شناسه' }],
        [{ text: 'حذف قطعه بر اساس شناسه' }],
        [{ text: 'استعلام قطعه به واسطه نام' }],
        [{ text: 'جستجو' }],
        [{ text: 'خروج' }]  // دکمه خروج اضافه شده
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
  bot.sendMessage(chatId, 'لطفاً یکی از گزینه‌ها را انتخاب کنید:', options);
}

function handleLogout(chatId) {
  bot.sendMessage(chatId, 'شما از سیستم خارج شدید. لطفاً برای ادامه، دوباره لاگین کنید.');
  delete userSessions[chatId];  // حذف وضعیت لاگین کاربر
  loginUser(chatId);  // بازگشت به مرحله لاگین
}

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  if (!userSessions[chatId] || !userSessions[chatId].loggedIn) {
    loginUser(chatId);  // اگر کاربر لاگین نباشد، درخواست لاگین می‌شود
    return;
  }

  if (text === 'افزودن قطعه به انبار') {
    inventoryController.addPart(bot, msg);
  } else if (text === 'تعریف پروژه') {
    projectController.createProject(bot, msg);
  } else if (text === 'نمایش موجودی انبار') {
    inventoryController.showInventory(bot, msg);
  } else if (text === 'لیست پروژه‌ها') {
    projectController.listProjects(bot, msg);
  } else if (text === 'ویرایش قطعات بر اساس شناسه') {
    inventoryController.updatePartById(bot, msg);
  } else if (text === 'حذف قطعه بر اساس شناسه') {
    inventoryController.deletePartById(bot, msg);
  } else if (text === 'استعلام قطعه به واسطه نام') {
    inventoryController.checkPartByName(bot, msg);
  } else if (text === 'جستجو') {
    showSearchOptions(chatId);
  } else if (text === 'خروج') {
    handleLogout(chatId);  // مدیریت خروج
  } else if (text === 'برگشت به منوی اصلی') {
      showMainMenu(chatId);
  }  else {
    bot.sendMessage(chatId, 'لطفاً یکی از گزینه‌ها را انتخاب کنید.');
  }
});

function showSearchOptions(chatId) {
  const options = {
    reply_markup: {
      keyboard: [
        [{ text: 'جستجو بر اساس نام قطعه' }],
        [{ text: 'جستجو بر اساس نام پروژه' }],
        [{ text: 'جستجو بر اساس تاریخ' }],
        [{ text: 'برگشت به منوی اصلی' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
  bot.sendMessage(chatId, 'لطفاً یکی از گزینه‌های جستجو را انتخاب کنید:', options);
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
