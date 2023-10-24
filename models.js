const { EntitySchema } = require('typeorm');


class DailyView {
    constructor(id, date, count) {
        this.id = id;
        this.date = date; // будет хранить только дату, без времени
        this.count = count; // будет хранить количество просмотров в этот день
    }
}

module.exports.DailyView = new EntitySchema({
    name: "DailyView",
    target: DailyView,
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        date: {
            type: "date"
        },
        count: {
            type: "int"
        }
    }
});
