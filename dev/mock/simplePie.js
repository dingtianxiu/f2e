/**
 * [simplePie description]
 * @param  {[type]} conf [description]
 * @return {[type]}      [description]
 * conf {
 * 	data: []
 * 	elemId:'',
 * 	width: 300,
 * 	height: 300,
 * 	colors: []
 * }
 */
function simplePie(conf) {
  var dataset = conf.data || [5, 10, 20, 40, 6, 25];
  //(1)转化数据为适合生成饼图的对象数组
  var pie = d3.layout.pie(dataset);
  var h = 300;
  var w = 300;
  var outerRadius = w / 2; //外半径
  //(7)圆环内半径
  var innerRadius = w / 3;
  //(2)用svg的path绘制弧形的内置方法
  var arc = d3.svg.arc() //设置弧度的内外径，等待传入的数据生成弧度
    .outerRadius(outerRadius).innerRadius(innerRadius);
  var ele = "#"+conf.elemId || "#chartPreview";
  var svg = d3.select(ele).append("svg").attr("width", w).attr(
    "height", h);

  //(3)颜色函数
  var color = conf.colors || d3.scale.category10(); //创建序数比例尺和包括10中颜色的输出范围
  //(4)准备分组,把每个分组移到图表中心
  var arcs = svg.selectAll("g.arc").data(pie(dataset)).enter()
    .append("g").attr("class", "arc")
    //移到图表中心
    .attr("transform",
      "translate(" + outerRadius + "," + outerRadius + ")"); //translate(a,b)a表示横坐标起点，b表示纵坐标起点
  //(5)为组中每个元素绘制弧形路路径
  arcs.append("path") //每个g元素都追加一个path元素用绑定到这个g的数据d生成路径信息
    .attr("fill", function(d, i) { //填充颜色
      return color(i);
    }).attr("d", arc); //将角度转为弧度（d3使用弧度绘制）
  //(6)为组中每个元素添加文本
  arcs.append("text") //每个g元素都追加一个path元素用绑定到这个g的数据d生成路径信息
    .attr("transform", function(d) {
      return "translate(" + arc.centroid(d) + ")"; //计算每个弧形的中心点（几何中心）
    }).attr("text-anchor", "middle").text(function(d) {
      return d.value; //这里已经转为对象了
    });
}
