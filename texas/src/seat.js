var Seat = {}, PokerPositionOnDesk = {};
for(var i=1;i<10;i++) {
    Seat[i] = Object.create(null, {
        empty: {value: true}
    });
}

Seat[1].x = 400, Seat[1].y = 77;
Seat[2].x = 605, Seat[2].y = 77;
Seat[3].x = 748, Seat[3].y = 188;
Seat[4].x = 748, Seat[4].y = 350;
Seat[5].x = 605, Seat[5].y = 452;
Seat[6].x = 210, Seat[6].y = 452;
Seat[7].x = 70, Seat[7].y = 350;
Seat[8].x = 70, Seat[8].y = 188;
Seat[9].x = 211, Seat[9].y = 77;


for(var i=1;i<6;i++){
    PokerPositionOnDesk[i] = Object.create(null, {
        empty: {value: true}
    });
}

PokerPositionOnDesk[1].x = 250, PokerPositionOnDesk[1].y = 270;
PokerPositionOnDesk[2].x = 320, PokerPositionOnDesk[2].y = 270;
PokerPositionOnDesk[3].x = 390, PokerPositionOnDesk[3].y = 270;
PokerPositionOnDesk[4].x = 460, PokerPositionOnDesk[4].y = 270;
PokerPositionOnDesk[5].x = 530, PokerPositionOnDesk[5].y = 270;