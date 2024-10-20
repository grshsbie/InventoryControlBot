const Inventory = require('../models/inventoryModel');
const moment = require('moment');

exports.addPart = (bot, msg) => {
  const chatId = msg.chat.id;

  // درخواست شناسه قطعه از کاربر
  bot.sendMessage(chatId, 'لطفاً شناسه قطعه را وارد کنید:');

  bot.once('message', (msg) => {
    const productId = msg.text;  // دریافت شناسه قطعه از کاربر

    // درخواست مدل قطعه
    bot.sendMessage(chatId, 'لطفاً مدل قطعه را وارد کنید:');

    bot.once('message', (msg) => {
      const model = msg.text;  // دریافت مدل قطعه از کاربر

      // درخواست تعداد قطعه
      bot.sendMessage(chatId, 'لطفاً تعداد قطعه را وارد کنید:');

      bot.once('message', (msg) => {
        const number = parseInt(msg.text, 10);  // دریافت تعداد قطعه

        // ذخیره اطلاعات در پایگاه داده
        const newPart = new Inventory({
          productId,  // شناسه قطعه وارد شده توسط کاربر
          model,      // مدل وارد شده توسط کاربر
          number,     // تعداد وارد شده
          date: new Date()  // تاریخ اضافه شدن
        });

        newPart.save()
          .then(() => {
            bot.sendMessage(chatId, 'قطعه با موفقیت به انبار اضافه شد!');

            // نمایش منوی دکمه‌های "اضافه کردن قطعه جدید" و "برگشت به منوی اصلی"
            const options = {
              reply_markup: {
                keyboard: [
                  [{ text: 'اضافه کردن قطعه جدید' }],
                  [{ text: 'برگشت به منوی اصلی' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
              }
            };

            bot.sendMessage(chatId, 'لطفاً یکی از گزینه‌ها را انتخاب کنید:', options);
          })
          .catch(err => {
            console.error('Error saving part:', err);
            bot.sendMessage(chatId, 'خطایی در ذخیره قطعه رخ داد.');
          });
      });
    });
  });
};




// نمایش موجودی انبار
exports.showInventory = (bot, msg) => {
  const chatId = msg.chat.id;

  Inventory.find({ isDeleted: false })  // فقط قطعاتی که حذف نشده‌اند
    .then(items => {
      if (items.length === 0) {
        bot.sendMessage(chatId, '📦 موجودی انبار خالی است.');
        return;
      }

      // ساختن متن برای نمایش موجودی
      let inventoryList = '📦 *موجودی انبار:*\n\n';
      items.forEach(item => {
        const formattedDate = moment(item.date).format('YYYY/MM/DD');
        inventoryList += `🔑 *شناسه:* ${item.productId}\n`;
        inventoryList += `📦 *مدل:* ${item.model}\n`;
        inventoryList += `🔢 *تعداد:* ${item.number}\n`;
        inventoryList += `📅 *تاریخ اضافه شدن:* ${formattedDate}\n\n`;
      });

      // ارسال پیام به صورت Markdown برای قالب‌بندی بهتر
      bot.sendMessage(chatId, inventoryList, { parse_mode: 'Markdown' });
    })
    .catch(err => {
      console.error('Error fetching inventory:', err);
      bot.sendMessage(chatId, 'خطا در نمایش موجودی انبار.');
    });
};

// حذف قطعه بر اساس شناسه
exports.deletePartById = (bot, msg) => {
  const chatId = msg.chat.id;

  // درخواست شناسه قطعه برای حذف
  bot.sendMessage(chatId, 'لطفاً شناسه قطعه‌ای که می‌خواهید حذف کنید را وارد کنید:');

  bot.once('message', (msg) => {
    const productId = msg.text;

    if (productId === 'برگشت به منوی اصلی') {
      bot.sendMessage(chatId, 'عملیات لغو شد.');
      return;
    }

    // حذف قطعه از پایگاه داده
    Inventory.updateOne({ productId }, { $set: { isDeleted: true } })
      .then((result) => {
        if (result.nModified === 0) {
          bot.sendMessage(chatId, 'قطعه‌ای با این شناسه پیدا نشد.');
        } else {
          bot.sendMessage(chatId, 'قطعه با موفقیت حذف شد.');
        }
      })
      .catch(err => {
        console.error('Error deleting part:', err);
        bot.sendMessage(chatId, 'خطایی در حذف قطعه رخ داد.');
      });
  });
};

// ویرایش قطعه بر اساس شناسه
exports.updatePartById = (bot, msg) => {
  const chatId = msg.chat.id;

  // درخواست شناسه قطعه برای بروزرسانی
  bot.sendMessage(chatId, 'لطفاً شناسه قطعه‌ای که می‌خواهید بروزرسانی کنید را وارد کنید:');

  bot.once('message', (msg) => {
    const productId = msg.text;

    if (productId === 'برگشت به منوی اصلی') {
      bot.sendMessage(chatId, 'عملیات لغو شد.');
      return;
    }

    // درخواست مدل جدید
    bot.sendMessage(chatId, 'لطفاً مدل جدید قطعه را وارد کنید:');

    bot.once('message', (msg) => {
      const newModel = msg.text;

      if (newModel === 'برگشت به منوی اصلی') {
        bot.sendMessage(chatId, 'عملیات لغو شد.');
        return;
      }

      // درخواست تعداد جدید
      bot.sendMessage(chatId, 'لطفاً تعداد جدید قطعه را وارد کنید:');

      bot.once('message', (msg) => {
        const newNumber = parseInt(msg.text, 10);

        if (msg.text === 'برگشت به منوی اصلی') {
          bot.sendMessage(chatId, 'عملیات لغو شد.');
          return;
        }

        // بررسی معتبر بودن مقدار عدد
        if (isNaN(newNumber)) {
          bot.sendMessage(chatId, 'لطفاً یک عدد معتبر برای تعداد وارد کنید.');
          return;
        }

        // بروزرسانی قطعه در پایگاه داده
        Inventory.updateOne({ productId }, { $set: { model: newModel, number: newNumber } })
          .then((result) => {
            if (result.nModified === 0) {
              bot.sendMessage(chatId, 'قطعه‌ای با این شناسه پیدا نشد یا تغییری اعمال نشد.');
            } else {
              bot.sendMessage(chatId, 'قطعه با موفقیت بروزرسانی شد.');
            }
          })
          .catch(err => {
            console.error('Error updating part:', err);
            bot.sendMessage(chatId, 'خطایی در بروزرسانی قطعه رخ داد.');
          });
      });
    });
  });
};

exports.checkPartByName = (bot, msg) => {
  const chatId = msg.chat.id;

  // درخواست نام قطعه از کاربر
  bot.sendMessage(chatId, 'لطفاً نام قطعه را وارد کنید:');

  bot.once('message', (msg) => {
    const partName = msg.text;  // دریافت نام قطعه از کاربر

    if (partName === 'برگشت به منوی اصلی') {
      showMainMenu(bot, chatId);
      return;
    }

    // جستجو برای موجودی قطعه بر اساس نام
    Inventory.findOne({ model: partName })
      .then(part => {
        if (part) {
          bot.sendMessage(chatId, `موجودی قطعه "${part.model}": ${part.number} عدد.`);
        } else {
          bot.sendMessage(chatId, 'قطعه‌ای با این نام یافت نشد.');
        }
      })
      .catch(err => {
        console.error('Error fetching part:', err);
        bot.sendMessage(chatId, 'خطایی در بازیابی موجودی قطعه رخ داد.');
      });
  });
};
