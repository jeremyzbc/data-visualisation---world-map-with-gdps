d3.select(window).on("resize", throttle);

var zoom = d3.behavior.zoom()
.scaleExtent([1, 9])
.on("zoom", move);


var width = document.querySelector('.gdp-map').offsetWidth;
var height = width / 2;

var topo,projection,path,svg,g;

var graticule = d3.geo.graticule();

var tooltip = d3.select(".gdp-map").append("div").attr("class", "tooltip hidden");

setup(width,height);

function setup(width,height){
  projection = d3.geo.mercator()
  .translate([(width/2), (height/2)])
  .scale( width / 2 / Math.PI);

  path = d3.geo.path().projection(projection);

  svg = d3.select(".gdp-map").append("svg")
  .attr("width", width)
  .attr("height", height + 8)
  .call(zoom)
  .on("click", click)
  .append("g");

  g = svg.append("g");

}

d3.json("https://api.github.com/gists/9398333", function(error, root) {

  var world = root.files['world.json'].content
  world = JSON.parse(world)
  var countries = topojson.feature(world, world.objects.countries).features;

  topo = countries;
  draw(topo);

});

function draw(topo) {

  var country = g.selectAll(".country").data(topo);

  country.enter().insert("path")
  .attr("class", "country")
  .attr("d", path)
  .attr("id", function(d,i) { return d.id; })
  .attr("title", function(d,i) { return d.properties.name; })
  .style("fill", function(d, i) { return "#49cc90";return d.properties.color; });

  //offsets for tooltips
  var offsetL = document.querySelector('.gdp-map').offsetLeft+20;
  var offsetT = document.querySelector('.gdp-map').offsetTop+10;


  d3.json("./data/data.json", function(error, root) {
      var gdps = root;
      var gdpTableTemplate = '<table>';
      gdps.forEach(function(gdp){
        gdpTableTemplate += '<tr><td>' + gdp.Country + '</td><td>' + gdp.GDP + '</td></tr>';
      })
      gdpTableTemplate += '</table>';
      $('.gdp-table').html(gdpTableTemplate);
      //tooltips
      country
      .on("mousemove", function(d,i) {
        gdps.forEach(function(gdp){
            if(d.properties.name == gdp.Country){
                d.properties.ranking = gdp.Ranking;
                d.properties.gdp = gdp.GDP;
            }
        })

        var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );

        tooltip.classed("hidden", false)
        .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
        .html(d.properties.name + '</br>Ranking: ' + d.properties.ranking + '</br>GDP: ' + d.properties.gdp);

      })
      .on("mouseout",  function(d,i) {
        tooltip.classed("hidden", true);
      });
  });
}


function redraw() {
  width = document.querySelector('.gdp-map').offsetWidth;
  height = width / 2;
  d3.select('svg').remove();
  setup(width,height);
  draw(topo);
}


function move() {

  var t = d3.event.translate;
  var s = d3.event.scale;
  zscale = s;
  var h = height/4;


  t[0] = Math.min(
    (width/height)  * (s - 1),
    Math.max( width * (1 - s), t[0] )
  );

  t[1] = Math.min(
    h * (s - 1) + h * s,
    Math.max(height  * (1 - s) - h * s, t[1])
  );

  zoom.translate(t);
  g.attr("transform", "translate(" + t + ")scale(" + s + ")");

  //adjust the country hover stroke width based on zoom level
  d3.selectAll(".country").style("stroke-width", 1.5 / s);

}

var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
  throttleTimer = window.setTimeout(function() {
    redraw();
  }, 200);
}


//geo translation on mouse click in map
function click() {
  var latlon = projection.invert(d3.mouse(this));
  console.log(latlon);
}


//function to add points and text to the map (used in plotting capitals)
function addpoint(longitude, latitude, text) {

  var gpoint = g.append("g").attr("class", "gpoint");
  var x = projection([longitude, latitude])[0];
  var y = projection([longitude, latitude])[1];

  gpoint.append("svg:circle")
  .attr("cx", x)
  .attr("cy", y)
  .attr("class","point")
  .attr("r", 2)
  .style("fill", "#fff");

  //conditional in case a point has no associated text
  if(text.length>0){
    gpoint.append("text")
    .attr("x", x+2)
    .attr("y", y+2)
    .attr("class","text")
    .text(text)
    .style("fill", "#fff");
  }

}

