App = {
  web3Provider: null,
  contracts: {},
    
  init: function() { // 데이터 불러오고 html에 전기차 정보가 보이도록 한다.
    $.getJSON('../car.json', function(data) {
      var list = $('#list');
      var template = $('#template');

      for (i = 0; i < data.length; i++) {
        template.find('.id').text(data[i].id);
        template.find('.carno').text(data[i].carno);
        template.find('.cartype').text(data[i].cartype);
        template.find('img').attr('src', data[i].picture);
        template.find('.battery').text(data[i].battery);
        template.find('.motor').text(data[i].motor);
        template.find('.price').text(data[i].price);

        list.append(template.html());
      }
    })

    return App.initWeb3();

  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') { 
      // 브라우저에 메타마스크가 설치되어있다면(주어진 web3 인스턴스가 있다면)
      // 메타마스크의 web3 인스턴스를 브라우저에 주입시키기 때문
      App.web3Provider = web3.currentProvider; // 공급자를 불러와
      web3 = new Web3(web3.currentProvider); // 그 공급자의 정보를 바탕으로 다시 우리 댑에서 쓸수있는 웹3 오브젝트를 만든다. 
    }
    else { // typeof web3 == 'undefined'
      // 브라우저에 메타마스크가 설치 x
      // 주입된 web3 인스턴스 존재하지 않는다면
      App.web3Provider = new web3.providers.HttpProvider('http://localhost:8545'); // 로컬 공급자의 rpc 서버에 연결해서 공급자의 정보 가져오고 대입해라.
      web3 = new Web3(App.web3Provider); // 가나슈면 로컬호스트가 가나슈가 되는거야

    }

    return App.initContract();
    
  },

  // 스마트컨트랙을 인스턴스화시킴
  // 그래야 web3가 우리 컨트랙을 어디서 찾고 어떻게 작동하는지 알 수 있다.
  // 이 작업을 순탄하게 하기 위해 truffle에서 라이브러리 제공 -> js 폴더의 truffle-contract.j
  initContract: function() {
        $.getJSON('CarLifeCycle.json', function(data) {
      // 아티팩 파일은 abi 정보와 컨트랙 배포된 주소 가지고 있다. CarLifeCycle.json
      // 아티팩 파일에 있는 데이터를 TruffleContract에서 제공하는 라이브러리 TruffleContract를 넘겨서 컨트랙을 인스턴스화 시킨다.
      App.contracts.CarLifeCycle = TruffleContract(data); 
      // 컨트랙의 공급자 설정
      App.contracts.CarLifeCycle.setProvider(App.web3Provider);

      return App.listenToEvents();

    });
        
  },

  addCar: function() {
    var carno = $('#carno').val(); 
    var cartype = $('#cartype').val();
    var battery = $('#carbattery').val();
    var motor = $('#carmotor').val();
    var price = $('#carprice').val();

    App.contracts.CarLifeCycle.deployed().then(function(instance){
      return instance.addCar.call(carno, cartype, battery, motor, price);
    }).then(function(){
      alert("자동차 등록이 완료 됐습니다.\n");

      // input 초기화
      $('#carno').val('');
      $('#cartype').val('');
      $('#carbattery').val('');
      $('#carmotor').val('');
      $('#carprice').val('');
      $('#addModal').modal('hide'); // 모달 창 닫기
    }).catch(function(err){
      console.log(err.message);
    });
  },


  editCar: function() {
    var carno = $('#carno').val(); 
    var carbattery = $('#carbattery').val();
    var carmotor = $('#carmotor').val();

    App.contracts.CarLifeCycle.deployed().then(function(instance){
      return instance.editCar.call(carno, carbattery, carmotor);
    }).then(function(){
      
      alert("정보 수정이 완료 됐습니다.\n");

      // input 초기화
      $('#carbattery').val('');
      $('#carmotor').val('');
      $('#editModal').modal('hide'); // 모달 창 닫기
    }).catch(function(err){
      console.log(err.message);
    });
  },

  buyCar: function() {	
    var id = $('#id').val(); // hidden type의 id 가져오는 것 맨아래 init에서 설정 해줬음!
    var name = $('#name').val();
    var price = $('#price').val();
    var hp = $('#hp').val();

   //web3 통해 연결된 노드 계정 불러와야
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      // 전역변수 기반으로 컨트랙에 접근!
      App.contracts.CarLifeCycle.deployed().then(function(instance) {
        // utf파일 라이브러리 따로 추가했음
        var nameUtf8Encoded = utf8.encode(name); // 이걸 다시 hex로 변환해야함
        return instance.buyCar(id, web3.toHex(nameUtf8Encoded), hp, { from: account, value: price }); // 이더 값도 넘겨야해서 age 뒤에 하나 더
      }).then(function() {
        // input 초기화
        $('#name').val('');
        $('#hp').val('');
        $('#buyModal').modal('hide'); // 모달 창 닫기

      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  loadCar: function() {
    // getAllBuyers를 가져와 매입이 된 매물인지 확인하기
    App.contracts.CarLifeCycle.deployed().then(function(instance) {
      return instance.getAllBuyers.call();
    }).then(function(buyers) {
      for (i = 0; i < buyers.length; i++) { // 10번 돌 것이다
        if (buyers[i] !== '0x0000000000000000000000000000000000000000') {  // 빈주소가 아니라면, 매물이 팔렸다면
          //이미지 교체를 위해 팔린 이미지 찾기
          var imgType = $('.panel-carlifecycle').eq(i).find('img').attr('src').substr(4); // 이미지 이름만 가져온다

          console.log("buyer i : " + buyers.length);
          console.log("imgType : " + imgType);

          switch(imgType) {
              case '1.jpg':
              $('.panel-carlifecycle').eq(i).find('img').attr('src', 'img/soldout.jpg')
                  break;
              case '2.jpg':
              $('.panel-carlifecycle').eq(i).find('img').attr('src', 'img/soldout.jpg')
                break;
              case '3.jpg':
              $('.panel-carlifecycle').eq(i).find('img').attr('src', 'img/soldout.jpg')
                  break;
              case '4.jpg':
              $('.panel-carlifecycle').eq(i).find('img').attr('src', 'img/soldout.jpg')
                break;
              case '5.jpg':
              $('.panel-carlifecycle').eq(i).find('img').attr('src', 'img/soldout.jpg')
                 break;
              case '6.jpg':
              $('.panel-carlifecycle').eq(i).find('img').attr('src', 'img/soldout.jpg')
                 break;
              case '7.jpg':
              $('.panel-carlifecycle').eq(i).find('img').attr('src', 'img/soldout.jpg')
                  break;
              case '8.jpg':
              $('.panel-carlifecycle').eq(i).find('img').attr('src', 'img/soldout.jpg')
                  break;
              case '9.jpg':
              $('.panel-carlifecycle').eq(i).find('img').attr('src', 'img/soldout.jpg')
                  break;
              case '10.jpg':
              $('.panel-carlifecycle').eq(i).find('img').attr('src', 'img/soldout.jpg')
                  break;
          }

          // 해당 템플릿의 매입->팔림 으로 바꾸고 버튼 비활성화
          $('.panel-carlifecycle').eq(i).find('.btn-buy').text('팔림').attr('disabled', true);
          $('.panel-carlifecycle').eq(i).find('.btn-buyerInfo').removeAttr('style');
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    })
    
  },
    
  listenToEvents: function() {
    App.contracts.CarLifeCycle.deployed().then(function(instance) { // 컨트랙의 인스턴스 받아오고
      // 필터(모든 이벤트 감지하자 그래서 비워둠), 범위(0번블록부터 최근블록까지 로그 계속 감지하도록!).감지 & callback으로 error와 event를 받는다
      instance.LogBuyCar({}, { fromBlock: 0, toBlock: 'latest' }).watch(function(error, event) { 

        console.log(event)

        if (!error) { // error가 없다면, event가 발살되면!
          $('#events').append('<p>' + event.args._buyer + ' 계정에서 ' + event.args._id + ' 번 전기차를 매입했습니다.' + '</p>');
        }
        else {
          console.error(error);
        }
        App.loadCar(); // 변경된 내용 페이지에 적용시키자
      })
    })
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });

  // 다 로드 되면 어떤 걸 할 것인가
  $('#buyModal').on('show.bs.modal', function(e) {
    var id = $(e.relatedTarget).parent().find('.id').text();
    var price = web3.toWei(parseFloat($(e.relatedTarget).parent().find('.price').text() || 0), "ether");

    $(e.currentTarget).find('#id').val(id);
    $(e.currentTarget).find('#price').val(price);

  });

  $('#addModal').on('show.bs.modal', function(e) {
    var carno = $(e.relatedTarget).parent().find('.carno').text();
    var cartype = $(e.relatedTarget).parent().find('.cartype').text();
    var carbattery = $(e.relatedTarget).parent().find('.carbattery').text();
    var carmotor = $(e.relatedTarget).parent().find('.carmotor').text();
    var carprice = $(e.relatedTarget).parent().find('.carprice').text();

    $(e.currentTarget).find('#carno').val(carno);
    $(e.currentTarget).find('#cartype').val(cartype);
    $(e.currentTarget).find('#carbattery').val(carbattery);
    $(e.currentTarget).find('#carmotor').val(carmotor);
    $(e.currentTarget).find('#carprice').val(carprice);

  });

  $('#editModal').on('show.bs.modal', function(e) {
    var carno = $(e.relatedTarget).parent().find('.carno').text();
    var cartype = $(e.relatedTarget).parent().find('.cartype').text();
    var battery = $(e.relatedTarget).parent().find('.battery').text();
    var price = $(e.relatedTarget).parent().find('.price').text();
    var motor = $(e.relatedTarget).parent().find('.motor').text();

    $(e.currentTarget).find('#carno').val(carno);
    $(e.currentTarget).find('#battery').val(battery);
    $(e.currentTarget).find('#motor').val(motor);
    $(e.currentTarget).find('#cartype').val(cartype);
    $(e.currentTarget).find('#price').val(price);

  });



  // 구매자 정보 버튼 활성화 되어있다면
  $('#buyerInfoModal').on('show.bs.modal', function(e) {
    var id = $(e.relatedTarget).parent().find('.id').text();
  
    App.contracts.CarLifeCycle.deployed().then(function(instance) {
      return instance.getBuyerInfo.call(id);
    }).then(function(buyInfo) {
      $(e.currentTarget).find('#buyerAddress').text(buyInfo[0]);
      $(e.currentTarget).find('#buyerName').text(web3.toUtf8(buyInfo[1])); // 이름은 꼭 utf 변환
      $(e.currentTarget).find('#buyerHp').text(buyInfo[2]);
    }).catch(function(error) {
      console.log(err.message);
    })
  });
});
