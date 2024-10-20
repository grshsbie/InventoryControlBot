const Project = require('../models/projectModel');
const Inventory = require('../models/inventoryModel');  // برای دریافت لیست قطعات
const moment = require('moment');


exports.createProject = (bot, msg) => {
  const chatId = msg.chat.id;
  const selectedParts = [];  // لیست موقت برای ذخیره قطعات انتخاب‌شده

  bot.sendMessage(chatId, 'لطفاً نام پروژه را وارد کنید:');

  bot.once('message', (msg) => {
    const projectName = msg.text;

    if (projectName === 'برگشت به منوی اصلی') {
      bot.sendMessage(chatId, 'عملیات لغو شد.');
      return;
    }

    bot.sendMessage(chatId, 'لطفاً تاریخ شروع پروژه را به فرمت YYYY-MM-DD وارد کنید:');

    bot.once('message', (msg) => {
      const startDate = new Date(msg.text);

      if (msg.text === 'برگشت به منوی اصلی') {
        bot.sendMessage(chatId, 'عملیات لغو شد.');
        return;
      }

      if (isNaN(startDate.getTime())) {
        bot.sendMessage(chatId, 'تاریخ شروع وارد شده معتبر نیست.');
        return;
      }

      bot.sendMessage(chatId, 'لطفاً تاریخ پایان پروژه را به فرمت YYYY-MM-DD وارد کنید:');

      bot.once('message', (msg) => {
        const endDate = new Date(msg.text);

        if (msg.text === 'برگشت به منوی اصلی') {
          bot.sendMessage(chatId, 'عملیات لغو شد.');
          return;
        }

        if (isNaN(endDate.getTime())) {
          bot.sendMessage(chatId, 'تاریخ پایان وارد شده معتبر نیست.');
          return;
        }

        Inventory.find()
          .then(items => {
            if (items.length === 0) {
              bot.sendMessage(chatId, 'هیچ قطعه‌ای در انبار موجود نیست.');
              return;
            }

            const inlineKeyboard = items.map(item => [{ text: `${item.model} - تعداد: ${item.number}`, callback_data: item.productId }]);

            inlineKeyboard.push([{ text: 'تمام', callback_data: 'done' }]);

            bot.sendMessage(chatId, 'لطفاً قطعات مورد نظر برای پروژه را انتخاب کنید:', {
              reply_markup: {
                inline_keyboard: inlineKeyboard
              }
            });

            bot.on('callback_query', callbackQuery => {
              const partId = callbackQuery.data;

              if (partId === 'done') {
                if (selectedParts.length === 0) {
                  bot.sendMessage(chatId, 'شما هیچ قطعه‌ای برای پروژه انتخاب نکردید.');
                } else {
                  bot.sendMessage(chatId, 'پروژه با موفقیت تعریف شد.');

                  const newProject = new Project({
                    name: projectName,
                    parts: selectedParts,
                    startDate,
                    endDate
                  });

                  newProject.save()
                    .then(() => {
                      bot.sendMessage(chatId, `پروژه "${projectName}" با موفقیت ایجاد شد.`);
                    })
                    .catch(err => {
                      console.error('Error saving project:', err);
                      bot.sendMessage(chatId, 'خطایی در ذخیره پروژه رخ داد.');
                    });

                  bot.sendMessage(chatId, `پروژه "${projectName}" با قطعات زیر تعریف شد:\n${selectedParts.map(part => `${part.model} - تعداد: ${part.number}`).join('\n')}`);
                }
                return;
              }

              Inventory.findOne({ productId: partId })
                .then(item => {
                  if (item && item.number > 0) {
                    selectedParts.push({ model: item.model, number: 1 });

                    Inventory.updateOne({ productId: partId }, { $inc: { number: -1 } })
                      .then(() => {
                        bot.sendMessage(chatId, `قطعه "${item.model}" اضافه شد و یک عدد از موجودی کسر شد.`);
                      })
                      .catch(err => {
                        console.error('Error updating inventory:', err);
                        bot.sendMessage(chatId, 'خطایی در کسر موجودی انبار رخ داد.');
                      });
                  } else {
                    bot.sendMessage(chatId, 'موجودی این قطعه کافی نیست.');
                  }
                })
                .catch(err => {
                  console.error('Error fetching part:', err);
                  bot.sendMessage(chatId, 'خطایی در بازیابی اطلاعات قطعه رخ داد.');
                });
            });
          })
          .catch(err => {
            console.error('Error fetching inventory:', err);
            bot.sendMessage(chatId, 'خطایی در نمایش لیست قطعات رخ داد.');
          });
      });
    });
  });
};

// نمایش لیست پروژه‌ها
exports.listProjects = (bot, msg) => {
  const chatId = msg.chat.id;

  Project.find()
    .then(projects => {
      if (projects.length === 0) {
        bot.sendMessage(chatId, 'هیچ پروژه‌ای تعریف نشده است.');
        return;
      }

      // ساخت دکمه‌های تعاملی برای هر پروژه
      const inlineKeyboard = projects.map(project => [{ text: project.name, callback_data: project._id }]);

      bot.sendMessage(chatId, 'لیست پروژه‌ها:', {
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
      });

      // مدیریت انتخاب پروژه
      bot.on('callback_query', callbackQuery => {
        const projectId = callbackQuery.data;

        // نمایش جزئیات پروژه
        Project.findById(projectId)
          .then(project => {
            if (!project) {
              bot.sendMessage(chatId, 'پروژه‌ای با این شناسه پیدا نشد.');
              return;
            }

            let projectDetails = `📋 *پروژه:* ${project.name}\n`;
            projectDetails += `📅 *تاریخ شروع:* ${moment(project.startDate).format('YYYY/MM/DD')}\n`;
            projectDetails += `📅 *تاریخ پایان:* ${moment(project.endDate).format('YYYY/MM/DD')}\n\n`;

            project.parts.forEach(part => {
              projectDetails += `🔧 *قطعه:* ${part.model}\n`;
              projectDetails += `🔢 *تعداد:* ${part.number}\n\n`;
            });

            bot.sendMessage(chatId, projectDetails, { parse_mode: 'Markdown' });
          })
          .catch(err => {
            console.error('Error fetching project:', err);
            bot.sendMessage(chatId, 'خطایی در نمایش جزئیات پروژه رخ داد.');
          });
      });
    })
    .catch(err => {
      console.error('Error fetching projects:', err);
      bot.sendMessage(chatId, 'خطایی در نمایش لیست پروژه‌ها رخ داد.');
    });
};

// جستجو بر اساس نام قطعه
exports.searchByPartName = (bot, msg) => {
  const chatId = msg.chat.id;

  // درخواست نام قطعه
  bot.sendMessage(chatId, 'لطفاً نام قطعه را وارد کنید:');

  bot.once('message', (msg) => {
    const partName = msg.text;

    if (partName === 'برگشت به منوی اصلی') {
      bot.sendMessage(chatId, 'عملیات لغو شد.');
      return;
    }

    // پیدا کردن پروژه‌هایی که از این قطعه استفاده کرده‌اند
    Project.find({ 'parts.model': partName })
      .then(projects => {
        if (projects.length === 0) {
          bot.sendMessage(chatId, 'هیچ پروژه‌ای با این قطعه پیدا نشد.');
          return;
        }

        let projectList = `📋 *پروژه‌هایی که از قطعه "${partName}" استفاده کرده‌اند:*\n\n`;
        projects.forEach(project => {
          projectList += `🔹 *پروژه:* ${project.name}\n`;
        });

        bot.sendMessage(chatId, projectList, { parse_mode: 'Markdown' });
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        bot.sendMessage(chatId, 'خطایی در جستجو رخ داد.');
      });
  });
};

// جستجو بر اساس نام پروژه
exports.searchByProjectName = (bot, msg) => {
  const chatId = msg.chat.id;

  // درخواست نام پروژه
  bot.sendMessage(chatId, 'لطفاً نام پروژه را وارد کنید:');

  bot.once('message', (msg) => {
    const projectName = msg.text;

    if (projectName === 'برگشت به منوی اصلی') {
      bot.sendMessage(chatId, 'عملیات لغو شد.');
      return;
    }

    // پیدا کردن پروژه با نام وارد شده
    Project.findOne({ name: projectName })
      .then(project => {
        if (!project) {
          bot.sendMessage(chatId, 'هیچ پروژه‌ای با این نام پیدا نشد.');
          return;
        }

        let projectDetails = `📋 *جزئیات پروژه "${projectName}":*\n\n`;
        projectDetails += `📅 *تاریخ شروع:* ${moment(project.startDate).format('YYYY/MM/DD')}\n`;
        projectDetails += `📅 *تاریخ پایان:* ${moment(project.endDate).format('YYYY/MM/DD')}\n\n`;

        project.parts.forEach(part => {
          projectDetails += `🔧 *قطعه:* ${part.model}\n`;
          projectDetails += `🔢 *تعداد:* ${part.number}\n\n`;
        });

        bot.sendMessage(chatId, projectDetails, { parse_mode: 'Markdown' });
      })
      .catch(err => {
        console.error('Error fetching project:', err);
        bot.sendMessage(chatId, 'خطایی در جستجو رخ داد.');
      });
  });
};

// جستجو بر اساس تاریخ
exports.searchByDate = (bot, msg) => {
  const chatId = msg.chat.id;

  // درخواست تاریخ جستجو
  bot.sendMessage(chatId, 'لطفاً تاریخ را به فرمت YYYY-MM-DD وارد کنید:');

  bot.once('message', (msg) => {
    const date = new Date(msg.text);

    if (msg.text === 'برگشت به منوی اصلی') {
      bot.sendMessage(chatId, 'عملیات لغو شد.');
      return;
    }

    if (isNaN(date.getTime())) {
      bot.sendMessage(chatId, 'تاریخ وارد شده معتبر نیست.');
      return;
    }

    // پیدا کردن پروژه‌ها و قطعات اضافه شده در آن تاریخ
    Project.find({ $or: [{ startDate: date }, { endDate: date }] })
      .then(projects => {
        let projectList = '📋 *پروژه‌ها در این تاریخ:*\n\n';
        projects.forEach(project => {
          projectList += `🔹 *پروژه:* ${project.name}\n`;
        });

        Inventory.find({ date: date })
          .then(parts => {
            let partList = '📦 *قطعات اضافه‌شده در این تاریخ:*\n\n';
            parts.forEach(part => {
              partList += `🔧 *قطعه:* ${part.model}\n`;
            });

            bot.sendMessage(chatId, `${projectList}\n${partList}`, { parse_mode: 'Markdown' });
          })
          .catch(err => {
            console.error('Error fetching parts:', err);
            bot.sendMessage(chatId, 'خطایی در جستجو رخ داد.');
          });
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        bot.sendMessage(chatId, 'خطایی در جستجو رخ داد.');
      });
  });
};
