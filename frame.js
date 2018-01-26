//for 參考自pm2.5、dht
//chi sheng chen
+(function (factory) {
  if (typeof exports === 'undefined') {
    factory(webduino || {});
  } else {
    module.exports = factory;
  }
}(function (scope) {
  'use strict';


  var Module = scope.Module,
    BoardEvent = scope.BoardEvent,
    proto;

var 感測器_MESSAGE = [0x04, 0x自訂],
    MIN_READ_INTERVAL = 1000,
    MIN_RESPONSE_TIME = 30,
    RETRY_INTERVAL = 6000;    

 var 感測器Event = {
    READ: 'read',
    READ_ERROR: 'readError'
  };



function 感測器(board, 腳位) {  //腳位ex: G3(board, rx, tx)   或   Dht(board, pin)
	 Module.call(this);


	 this._type = 'G3';
     this._board = board;
     this._腳位 = 腳位;   //ex:  this._rx = rx;
                          //     this._tx = tx; (pm2.5)  
                          // or  this._pin = pin;(dht)
     
     this._感測器感應項目/感測值 = null; //ex:  (pm2.5) 
                                  //      this._pm25 = null;
                                  //      this._pm10 = null;
                                  //     (dht)
                                  //      this._humidity = null;
                                  //      this._temperature = null;
                                  //      this._lastRecv = null;
   
     this._readTimer = null;
     this._readCallback = function () {};

    this._board.on(BoardEvent.BEFOREDISCONNECT, this.stopRead.bind(this));
    this._messageHandler = onMessage.bind(this);
    this._board.on(BoardEvent.ERROR, this.stopRead.bind(this));

//Q1: 為啥 PM2.5在這裡需要一行
    this._board.sendSysex(G3_MESSAGE[0], [G3_MESSAGE[1], 0, rx.number, tx.number]);//而DHT不用?

     }


  function onMessage(event) {
    var message = event.message;

    if (message[0] !== 感測器_MESSAGE[0] || message[1] !== 感測器_MESSAGE[1]) {
      return;
    } else {
      processG3Data(this, message);
    }
  }

 function process感測器Data(self, data) {
    var str = '',
      i = ?;
    
    //Q3: 這塊是否有模版?

    self._lastRecv = Date.now();
    self.emit(感測器Event.READ, 回傳感測資料);
  }

  感測器.prototype = proto = Object.create(Module.prototype, {
    constructor: {
      value: 感測器
    },


                                //ex: (dht)
    感測值1: {                  //humidity: {
      get: function () {        //  get: function () {     
        return this._感測值1;   //   return this._humidity;
      }                         //  }
    },                          //},

    感測值2: {
      get: function () {
        return this._感測值2;
      }
    }
  });


proto.trigger = function (state, delaySec, repeatTime) {
    var self = this;
    var recvPin = this._接收資料腳位._number;          //ex:(pm2.5)-->  var recvPin = this._rx._number;
    var delayHigh6bit = (delaySec & 0x0FC0) >> 6;      //   (dht)-->   ar recvPin = this._pin._number;
    var delayLow6bit = (delaySec & 0x3F);
    var repeatHigh6bit = (repeatTime & 0x0FC0) >> 6;
    var repeatLow6bit = (repeatTime & 0x3F);
    if (state) {
      self._board.sendSysex(DHT_MESSAGE[0], [DHT_MESSAGE[1],
        0x40, delayHigh6bit + 1, delayLow6bit + 1,
        repeatHigh6bit + 1, repeatLow6bit + 1,
        DHT_MESSAGE[1], recvPin, 0x00
      ]);
    } else {
      self._board.sendSysex(感測器_MESSAGE[0], [感測器_MESSAGE[1], 0x41, 0]); //Q4: 0x41, 0怎來的?
    }
  }

proto.read = function (callback, interval) {
    var self = this,
      timer;

    self.stopRead();


if (typeof callback === 'function') {
      self._readCallback = function (感測值1, 感測值2) {   //ex: ...= function (pm25, pm10) {
        self._感測值1 = 感測值1;  // self._pm25 = pm25;
        self._感測值2 = 感測值2;  // self._pm10 = pm10;
        callback({           //ex: callback({   
          感測值1: 感測值1,        //       pm25: pm25,      
          感測值2: 感測值2         //       pm10: pm10 
        });
      };
      self._board.on(BoardEvent.SYSEX_MESSAGE, self._messageHandler);
      self.on(感測器Event.READ, self._readCallback);

       timer = function () {
        self._board.sendSysex(感測器_MESSAGE[0], [感測器_MESSAGE[1], 3]);  //Q5: pm2.5 l123  dht l133 如何定義...sendSysex(???)
        if (interval) {
          interval = Math.max(interval, MIN_READ_INTERVAL);
          if (self._lastRecv === null || Date.now() - self._lastRecv < 5 * interval) {
            self._readTimer = setTimeout(timer, interval);
          } else {
            self.stopRead();
            setTimeout(function () {
              self.read(callback, interval);
            }, RETRY_INTERVAL);
          }
        }
      };

      timer();
    } else {
      return new Promise(function (resolve, reject) {
        self.read(function (data) {
          self._感測值1 = data.感測值1;
          self._感測值2 = data.感測值2;
          setTimeout(function () {
            resolve(data);
          }, MIN_RESPONSE_TIME);
        });
      });
    }
  };

 proto.stopRead = function () {
    this.removeListener(G3Event.READ, this._readCallback);
    this._board.removeListener(BoardEvent.SYSEX_MESSAGE, this._messageHandler);
    this._lastRecv = null;

    if (this._readTimer) {
      clearTimeout(this._readTimer);
      delete this._readTimer;
    }
  };

   scope.module.感測器Event = 感測器Event;
   scope.module.感測器 = 感測器;
}));
