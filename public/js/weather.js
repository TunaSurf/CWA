
//Set popover details
$(function () {
    $("[data-toggle=popover]").popover( {
        trigger: "manual",
        html: true
    });
})


//Show sidebar by default only if window is wider than 1100px
if( $(window).width() > 1100) {
    $("#wrapper").addClass("toggled");
}


//Sidebar hide/show
$(".navbar-brand").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
    });


//sidebar edit and delete buttons
$("#edit").click(function(e) {
    $(".fa-cog").toggleClass("toggled");
    $(".fa-minus-circle").toggle();
});


//saving and deleting locations to favorites
$("#save").click(function() {
        var name = locationName;
        var newLocation = {location: name}

        if($("#save i").hasClass("fa-bookmark-o")) {
            $.ajax({
                type: "PATCH",
                url: "/weather/add",
                data: newLocation,
                success: function(data) {
                    localStorage.setItem("savePressed", true); //needed to keep track of the button click after the page reloads
                    location.reload();
                }
            });
        } else {
            $.ajax({
                type: "DELETE",
                url: "/weather/add",
                data: newLocation,
                success: function(data) {
                    location.reload();
                }
            });
        }
        return false;
});

//after save is clicked and page refreshes, local storage is used to set popover
$(document).ready(function(){
    if(localStorage.getItem("savePressed")) {
        localStorage.removeItem("savePressed");
        if(!$("#wrapper").hasClass("toggled")) {
            $(".navbar-brand").popover("show");
            setTimeout(function() {
                $('.popover').fadeOut('slow',function() {}); 
            },5000);
        }
    }
});

$("#makeHome").click(function() {
    var name = locationName;
    var newHome = {location: name}

    $.ajax({
        type: "PATCH",
        url: "/weather/newHome",
        data: newHome,
        success: function(data) {
            location.reload();
        }
    });
    return false;
});

$(".delete").click(function() {
    var name = $(this).next();
    var item = {_id: name.attr("id")}   //used _id here and location above just to use both of them. Either is interchangeable

    $.ajax({
        type: "DELETE",
        url: "/weather/add",
        data: item,
        success: function(data) {
            location.reload();
        }
    });
    return false;
});


//Google autocomplete
function initialize() {
	var input = document.getElementById("search");
	var options = {
            types: ["geocode"]
        };
	var autocomplete = new google.maps.places.Autocomplete(input, options);
}

google.maps.event.addDomListener(window, "load", initialize);


// Choose background based on weather
$(document).ready(function(){
    var backgroundImage = "url(../assets/" + weatherLabel + ".jpg)";
    $(".page-content-head").css("background-image", backgroundImage);
});

//Skycons
var skycons = new Skycons();
 var list = [
            "clear-day",
            "clear-night",
            "partly-cloudy-day",
            "partly-cloudy-night",
            "cloudy",
            "rain",
            "sleet",
            "snow",
            "wind",
            "fog"
          ];

for(var i = list.length; i--;) {
    var weatherType = list[i];
    var elements = document.getElementsByClassName(weatherType);
    for (var e = elements.length; e--;) {
        skycons.add(elements[e], weatherType);
    }
}

skycons.play();


//Format times
//Minutely
var timesMinutely = document.getElementsByClassName("time-minutely");
for(var i = 0; i < timesMinutely.length; i++) {
    var unixTime = parseInt(timesMinutely[i].innerText);
    var time = moment(unixTime * 1000).format('LT');
    if(i == 0) {
        time = "Now";
    }
    timesMinutely[i].innerText = time;
}

//Hourly
var timesHourly = document.getElementsByClassName("time-hourly");
for(var i = 0; i < timesHourly.length; i++) {
    var unixTime = timesHourly[i].innerText;
    var time = moment.unix(unixTime).format('h A');
    if(i == 0) {
        time = "Now";
    }
    timesHourly[i].innerText = time;
}

//Daily
var timesDaily = document.getElementsByClassName("time-daily");
for(var i = 0; i < timesDaily.length; i++) {
    var unixTime = parseInt(timesDaily[i].innerText);
    var time = moment.unix(unixTime).format('dddd');
    if(i == 0) {
        time = "Today";
    } else if( i == 1) {
        time = "Tomorrow";
    }
    timesDaily[i].innerText = time;
}


//forecast tabs
$("#btn-minutely").click(function() {
    $("#btn-minutely").addClass("forecast-btn-selected");
    $("#btn-hourly").removeClass("forecast-btn-selected");
    $("#btn-daily").removeClass("forecast-btn-selected");
    
    $(".forecast-minutely").show();
    $(".forecast-hourly").hide();
    $(".forecast-daily").hide();

    minutelyGraph();
    
});

$("#btn-hourly").click(function() {
    $("#btn-minutely").removeClass("forecast-btn-selected");
    $("#btn-hourly").addClass("forecast-btn-selected");
    $("#btn-daily").removeClass("forecast-btn-selected");

    $(".forecast-minutely").hide();
    $(".forecast-hourly").show();
    $(".forecast-daily").hide();
});

$("#btn-daily").click(function() {
    $("#btn-minutely").removeClass("forecast-btn-selected");
    $("#btn-hourly").removeClass("forecast-btn-selected");
    $("#btn-daily").addClass("forecast-btn-selected");

    $(".forecast-minutely").hide();
    $(".forecast-hourly").hide();
    $(".forecast-daily").show();
});


function minutelyGraph() {
    minutelyData = minutelyData.replace(/&#34;/g, '"');
    minutelyData = JSON.parse(minutelyData);

    var precipChance = [];
    var pointColor = "#003b82";
    minutelyData.data.forEach(function(e) {
        precipChance.push({
            x: moment(e.time * 1000).valueOf(),
            y: Math.round(100 * e.precipProbability),
            time: moment(e.time * 1000).format('LT'),
            precipIntensity: e.precipIntensity.toFixed(2)
        });
    });

    new Highcharts.chart('graph', {
        chart: {
            type: 'area',
            spacingTop: 30,
            backgroundColor: null
        },
        title: {
            text: ""
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats : {
                hour: '%I %p',
                minute: '%I:%M %p'
            },
            labels: {
                style: {
                    color: '#efe9f4'
                }
            }
        },
        yAxis: {
            max: 100,
            title: {
                text: '% Chance of Rain',
                style: {
                    color: '#efe9f4'
                }
            },
            labels: {
                style: {
                    color: '#efe9f4'
                }
            },
            gridLineColor: "rgba(255,255,255,0.2)"
        },
        plotOptions: {
            series: {
                marker: {
                    enabled: false
                },
                fillColor: {
                    linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
                    stops: [
                        [0, 'rgb(83, 136, 237)'],
                        [1, 'rgba(26, 139, 244, 0)']
                    ]
                }
            }
        },
        series: [{
            data: precipChance,
            color: 'rgb(107, 184, 234)',
            lineWidth: 2
        }],
        tooltip: {
            formatter: function() {
                return '<b>' + this.point.time + '</b><br>Probability: <b>' + this.point.y + '</b>%<br>Intensity: <b>' + this.point.precipIntensity + '</b> in/hr';
            }
        },
        legend: {
            enabled: false
        }
    });

    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });
}