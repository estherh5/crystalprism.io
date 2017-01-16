setInterval(everySecond,1000);
function everySecond(){
    var now = new Date();
    var time = now.getTime().toString();
    var onecolor = time.slice(-6);
    var twocolor = time.slice(-7,-1);
    var threecolor = time.slice(-8,-2);
    var fourcolor = time.slice(-9,-3);
    var one = time.slice(-1);
    var two = time.slice(-2,-1);
    var three = time.slice(-3,-2);
    var four = time.slice(-4,-3);
    var five = time.slice(-5,-4);
    var hours = ("0" + now.getHours()).slice(-2);
    var minutes = ("0" + now.getMinutes()).slice(-2);
    var seconds = ("0" + now.getSeconds()).slice(-2);
    document.getElementById('time').innerHTML = hours + ":" + minutes + ":" + seconds;
    document.getElementById('circle1').style.bottom = two + four * four + "px";
    document.getElementById('circle1').style.right = four + two * one + "px";
    document.getElementById('circle1').style.background = "#" + onecolor;
    document.getElementById('circle2').style.top = three + four * two + "px";
    document.getElementById('circle2').style.right = four + five * two + "px";
    document.getElementById('circle2').style.background = "#" + twocolor;
    document.getElementById('circle3').style.bottom = five + four * three + "px";
    document.getElementById('circle3').style.left = four + two * five + "px";
    document.getElementById('circle3').style.background = "#" + threecolor;
    document.getElementById('circle4').style.top = four + one * three + "px";
    document.getElementById('circle4').style.left = one + four * three + "px";
    document.getElementById('circle4').style.background = "#" + fourcolor;
}


// document.body.style.background = '#' + hex;
// document.getElementById('time').style.color = '#' + hex;
// document.getElementById('clockbox').style.outlineColor = '#' + hex;
// document.getElementById('hex').innerHTML = "#" + hex;
// document.getElementById('fulltime').innerHTML = time;
