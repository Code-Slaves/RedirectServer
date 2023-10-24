const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { createConnection, getConnection } = require('typeorm');
const { DailyView } = require('./models');

const app = express();
const port = 3000;





app.use(bodyParser.json());

let targetUrl = 'https://example.com';
// Предполагается, что PASSWORD_HASH был создан с использованием bcrypt и представляет собой хеш настоящего пароля.
const PASSWORD = 'D12345678'; // хеш вашего реального пароля.





app.post('/statistic', async (req, res) => {
  try {
    // Проверка аутентификации, аналогичная той, что используется в /update
    const isMatch = await checkPassword(PASSWORD, req.body.password);

    if (!isMatch) {
      res.status(401).send('Unauthorized');
      return;  // Этот return здесь необходим, чтобы прекратить выполнение, если пароль не совпадает
    }

    const startDate = req.body.startDate; // Извлечение дат из тела запроса
    const endDate = req.body.endDate;

    // Если даты не указаны, используем сегодняшний день для обоих
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const queryStartDate = startDate || today;
    const queryEndDate = endDate || today;

    const viewRepository = getConnection().getRepository(DailyView); // Предполагается, что 'DailyView' это ваша модель

    // Поиск в базе данных с использованием диапазона дат
    const visitStats = await viewRepository.createQueryBuilder("daily_view")
      .where("daily_view.date BETWEEN :start AND :end", { start: queryStartDate, end: queryEndDate })
      .getMany();

    // Вычисление общего количества посещений в заданном диапазоне
    const totalVisits = visitStats.reduce((total, daily) => total + daily.count, 0);

    // Отправка результата
    res.json({ 
      totalVisits,
      details: visitStats // Подробные данные по дням (опционально)
    });
  } catch (error) {
    console.error('Ошибка при извлечении статистики посещений', error);
    res.status(500).send('Internal Server Error');
  }
});






app.get('/', async (req, res) => {
  // Запись посещения при каждом запросе к корню
  try {
    await recordVisit(); // Здесь мы регистрируем посещение
    res.redirect(targetUrl);
  } catch (error) {
    console.error('Ошибка при записи посещения', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/update', async (req, res) => {
  try {
    const isMatch = await checkPassword(PASSWORD, req.body.password);
    
    if (!isMatch) {
      res.status(401).send('Unauthorized');
      return;
    }
    
    targetUrl = req.body.newUrl;
    res.send('OK');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Создание соединения с базой данных при старте приложения
createConnection().then(() => {
    console.log('Соединение с базой данных установлено!');

    // Запуск сервера после установки соединения с БД
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}).catch(error => {
    console.error('Ошибка при подключении к базе данных', error);
});




async function checkPassword(inputPassword, savedPasswordHash) {
  // bcrypt сравнит два пароля за вас и вернет true, если они совпадают, и false, если нет.
  return bcrypt.compare(inputPassword, savedPasswordHash);
}


async function recordVisit() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Обнуляем время, чтобы оставалась только дата

    // Преобразуем дату в строку, чтобы упростить сравнение в базе данных
    const todayString = today.toISOString().split('T')[0]; // 'YYYY-MM-DD'

    const viewRepository = getConnection().getRepository('DailyView');

    // Изменяем условие поиска для использования строки даты
    let view = await viewRepository.findOne({ where: { date: todayString } });

    if (!view) {
        // Если запись не существует, создаем новую с использованием метода create
        view = viewRepository.create({
            date: todayString, // используем строку даты
            count: 1
        });
    } else {
        // Если запись для сегодняшнего дня существует, увеличиваем счетчик
        view.count += 1;
    }

    await viewRepository.save(view); // Сохраняем изменения
}

