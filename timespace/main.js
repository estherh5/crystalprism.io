setInterval(everySecond,1000);
function everySecond(){
    var now = new Date();
    var time = now.getTime().toString();
    var circleOneColor = time.slice(-6);
    var circleTwoColor = time.slice(-7,-1);
    var circleThreeColor = time.slice(-8,-2);
    var circleFourColor = time.slice(-9,-3);
    var digitOne = time.slice(-1);
    var digitTwo = time.slice(-2,-1);
    var digitThree = time.slice(-3,-2);
    var digitFour = time.slice(-4,-3);
    var digitFive = time.slice(-5,-4);
    var hours = ("0" + now.getHours()).slice(-2);
    var minutes = ("0" + now.getMinutes()).slice(-2);
    var seconds = ("0" + now.getSeconds()).slice(-2);
    document.getElementById('time').innerHTML = hours + ":" + minutes + ":" + seconds;
    document.getElementById('circle-one').style.bottom = digitTwo + digitFour * digitFour + "px";
    document.getElementById('circle-one').style.right = digitFour + digitTwo * digitOne + "px";
    document.getElementById('circle-one').style.background = "#" + circleOneColor;
    document.getElementById('circle-two').style.top = digitThree + digitFour * digitTwo + "px";
    document.getElementById('circle-two').style.right = digitFour + digitFive * digitTwo + "px";
    document.getElementById('circle-two').style.background = "#" + circleTwoColor;
    document.getElementById('circle-three').style.bottom = digitFive + digitFour * digitThree + "px";
    document.getElementById('circle-three').style.left = digitFour + digitTwo * digitFive + "px";
    document.getElementById('circle-three').style.background = "#" + circleThreeColor;
    document.getElementById('circle-four').style.top = digitFour + digitOne * digitThree + "px";
    document.getElementById('circle-four').style.left = digitOne + digitFour * digitThree + "px";
    document.getElementById('circle-four').style.background = "#" + circleFourColor;
}


// document.body.style.background = '#' + hex;
// document.getElementById('time').style.color = '#' + hex;
// document.getElementById('clockbox').style.outlineColor = '#' + hex;
// document.getElementById('hex').innerHTML = "#" + hex;
// document.getElementById('fulltime').innerHTML = time;
