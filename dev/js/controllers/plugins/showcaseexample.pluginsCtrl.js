app.controller('showcaseexample.pluginsCtrl', ['$scope', '$state', '$cookies', 'globalConfig', 'dataService',
	function($scope, $state, $cookies, globalConfig, dataService) {
		var widgeClassName = [];
		var new_arr = []; //控件分类数组
		var allList = []; //所有实例数组
		var new_arr_json = []; //控件分类json
		$scope.widgetClassList = [];
		$scope.testList = {};

		// 设置高度
    	$(".wg_wrap").css("height",$(window).height());
		dataService.getData('queryThumbnailFileAdvance', '').success(function(qtfa) {
			$.each(qtfa.data, function(i, e) {
				widgeClassName.push(e.widgetCatName);
				allList.push(e);
			});

			getWidgetClassName(widgeClassName);
		});

		function getOnlyWidget(widgeClassName) {
			$.each(widgeClassName, function(i, e) {
				var items = e;　　　　
				if ($.inArray(items, new_arr) == -1) {　　　　
					new_arr.push(items);
				}
			});
			return new_arr;
		}

		function getWidgetClassName(widgeClassName) {
			var new_arr_1 = getOnlyWidget(widgeClassName);

			$.each(new_arr_1, function(i, e) {
				var json1 = {
					id: i,
					name: new_arr_1[i]
				};
				new_arr_json.push(json1);
			});
			$scope.widgetClassList = new_arr_json;

			$scope.testList = {
				"test1": new_arr_json,
				"test2": allList
			};
			insertLi($scope.testList);
		}

		function insertLi(new_arr_json_1) {
			if (new_arr_json_1.test1.length == 0) {
				$('.chart-part').append('<div style="font-size: 30px;color: #9D9D9E;margin-left: 400px;margin-top:250px ;">暂无可视化控件缩略图</div>')
			}
			$.each(new_arr_json_1.test1, function(i, e) {
				if(i==0){
					$('.chart-nav').append('<li id="bb' + i + '" class="bbsssss current" catId="' + e.id + '"><i></i><label>' + e.name + '</label></li>');
				}else {
					$('.chart-nav').append('<li id="bb' + i + '" class="bbsssss" catId="' + e.id + '"><i></i><label>' + e.name + '</label></li>');

				}
				//添加导航
				//添加整体框架
				$('.chart-part').append('<div class="first_content"catId="' + e.id + '"><h2 class="chart-title">' + e.name + '</h2><div class="picbox"  id="widgetExampleList' + i + '"><ul class="piclist mainlist"></ul></div></div>');

				$(".bbsssss").live("click", function() {
					$('.chart-nav li').removeClass('current')
					var catid = $(this).attr("catId");
					var id=$(this).attr("id");
					$('#'+id).addClass('current')
					var top = $(".chart-part div[catId='" + catid + "']").offset().top;
					$('.main_right').scrollTop(top);
				});
			});

			$.each(new_arr_json_1.test2, function(i, m) {
				$.each(new_arr_json_1.test1, function(j, n) {
					if (m.widgetCatName == n.name) {
						$('#widgetExampleList' + j + ' ul').append('<li class="tanzi"><a target="_blank" href="/#/showcase/' + m.id + '" ><img style="height:220px;width:220px;" id="aa' + i + '" alt="缩略图"/></a><p>' + m.name + '</p></li>');
						$('#aa' + i).attr("src", globalConfig.api.getres + '/' + m.thumbnailFileUid + '?ticket=' + $cookies.get('auth'));
					}
				});
			});
		}

		//获取点击的div名称
		// document.onclick = Hanlder;
        //
		// function Hanlder(e) {
		// 	e = e || event;
		// 	var tag = e.srcElement || e.target;
        //
		// 	var tagId = (tag.id).substring(0, 7);
        //
		// 	if (tagId == "og_next") {
		// 		var idName = tag.id;
		// 		//获取到父节点的第一个子节点
		// 		var listElement = document.getElementById(idName).previousElementSibling.previousElementSibling.firstElementChild;
		// 		//获取点击父节点的第一个子节点的li
		// 		var ulElement = document.getElementById(idName).previousElementSibling.previousElementSibling.firstElementChild.getElementsByTagName('li');
		// 		//获取list的样式
		// 		var ulStyle = listElement.currentStyle || document.defaultView.getComputedStyle(listElement, '');
		// 		var liWidth = ulElement.length * 250; //li长度
		// 		var ml = ulStyle.left; //左偏移位置
		// 		if (ulElement.length > 4) {
		// 			//左偏有值时可以点击
		// 			if (liWidth + parseInt(ml) > 1000) {
		// 				listElement.style.left = parseInt(ml) - 255 + 'px';
		// 			}
		// 		}
		// 	}
		// 	if (tagId == "og_prev") {
        //
		// 		var idName = tag.id;
		// 		//获取到父节点的第一个子节点
		// 		var listElement = document.getElementById(idName).previousElementSibling.firstElementChild;
		// 		//获取点击父节点的第一个子节点的li
		// 		var ulElement = document.getElementById(idName).previousElementSibling.firstElementChild.getElementsByTagName('li');
		// 		//获取list的样式
		// 		var ulStyle = listElement.currentStyle || document.defaultView.getComputedStyle(listElement, '');
		// 		var ml = ulStyle.left; //左偏移距离
		// 		var liWidth = ulElement.length * 250; //li长度
		// 		if (ulElement.length > 4) {
		// 			//左偏移长度+li大于1000px才能进行换位
		// 			if (parseInt(ml) + 250 <= 0) {
		// 				listElement.style.left = parseInt(ml) + 255 + 'px';
		// 			}
		// 		}
		// 	}
		// 	return tag.id
		// }


	}
]);