// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract CarLifeCycle {

    /* 자동차 정보 */
    struct Car {
        bytes32 carno;     // 자동차 번호
        bytes32 cartype;   // 자동차 모델명
        bytes32 battery;   // 배터리 품명
        bytes32 motor;     // 전기 모터 품명
        uint    price;     // 출고가
    }

    /* 구매자 정보 */
    struct Buyer {
        address buyerAddress; // 주소
        bytes32 name;         // 이름
        uint hp;              // 핸드폰번호
    }

    event product (
        bytes32 carno
    );

    mapping (uint => Buyer) public buyerInfo; // 자동차id 를 키값으로 하면 구매자의 정보를 불러오는 구조
    mapping (bytes32 => Car) public carInfo;  // 자동차 번호 를 키값으로 하면 자동차의 정보를 불러오는 구조


    address public owner;
    address[10] public buyers;

    event LogBuyCar(
        address _buyer,
        uint _id
    );

    /* 생성자 */
    constructor() public {
        owner = msg.sender; // contract 의 소유자(=배포할 때 사용한 계정)
    }

    /* 1 : 자동차 정보 등록 기능 */
    function addCar(bytes32 _carno, bytes32 _cartype, bytes32 _battery, bytes32 _motor, uint _price) public payable {
        carInfo[_carno] = Car(_carno, _cartype, _battery, _motor, _price);
    }

    /* 2 : 자동차 정보 수정 */
    function editCar(bytes32 _carno, bytes32 _battery, bytes32 _motor) public payable {
        carInfo[_carno].battery = _battery;
        carInfo[_carno].battery = _motor;
    }

    /* 3 : 자동차 구매 기능(자동차id, 구매자 이름, 구매자 핸드폰번호)             */
    /*   : payabl = 구매자가 구매했을 때 metamask 가 뜨고 이 함수로 eth 를 보내줌 */
    function buyCar(uint _id, bytes32 _name, uint _hp) public payable {
        require(_id >= 0 && _id <= 9);
        buyers[_id] = msg.sender; //구매자의 주소
        buyerInfo[_id] = Buyer(msg.sender, _name, _hp);

        owner.transfer(msg.value); //owner 계정으로 돈 송금

        emit LogBuyCar(msg.sender, _id); // 어떤 구매자가 몇번째 자동차를 구매 했는지

    }
    /* 4 : 자동차 구매자 확인 기능 */
    function getBuyerInfo(uint _id) public view returns (address, bytes32, uint) {
        Buyer memory buyer = buyerInfo[_id]; // 함수가 끝나면 buyer 변수는 휘발함
        return (buyer.buyerAddress, buyer.name, buyer.hp);
    }

    /* 5. 구매자 정보 다 가지고 오기 */
    function getAllBuyers() public view returns (address[10]) {
        return buyers;
    }
}

