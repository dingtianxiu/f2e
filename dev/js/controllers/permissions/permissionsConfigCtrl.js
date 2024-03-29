/**
 * Created by chenjing on 2016/3/17 0017.
 * 权限管理
 */
app.controller('permissionsConfigCtrl', ['$scope', 'globalConfig', '$rootScope', 'dataService', '$compile',
    function ($scope, globalConfig, $rootScope, dataService, $compile) {

        /**
         * 页面初始化
         */
        $scope.queryAll = function () {
            $scope.initTree();//加载节点
            $scope.TreeData = [];//保存树上的数据

            $scope.idOption = 0;//设置默认选中值
            // $scope.getPageParm();//加载列表
        }

        /**
         * 新增权限弹窗
         */
        $scope.addPermissions = function (type) {
            if (!type) {
                return;
            }

            if (type == 'menu_group') {//添加菜单组
                $scope.closeAddOpen = $rootScope.layerOpen({
                    type: 2,
                    title: '添加权限(菜单组)',
                    content: '/index.html#/dialog/permissionsConfig/addByNavGrounp/'
                });
                return;
            }

            if (type == 'page') {//添加页面
                $scope.closeAddOpen = $rootScope.layerOpen({
                    type: 2,
                    title: '添加权限(页面)',
                    content: '/index.html#/dialog/permissionsConfig/addByPage/'
                });
                return;
            }

            if (type == 'permission') {//添加权限
                $scope.closeAddOpen = $rootScope.layerOpen({
                    type: 2,
                    title: '添加权限(权限)',
                    content: '/index.html#/dialog/permissionsConfig/add/'
                });
                return;
            }

        }

        /**
         * 关闭弹窗事件
         */
        $scope.closeAddSources = function () {
            layer.close($scope.closeAddOpen);
        }

        /**
         * 弹窗回调函数
         */
        $scope.callbackOpen = function () {
            var data={data:{id:$scope.closeOpen}}
            $scope.getPageParm(data);//根据返回数据刷新页面
        }

        /**
         * 初始化树形菜单
         */
        $scope.initTree = function () {
            $rootScope.safeApply(function () {
                    $scope.myTreeOption = {
                        url: 'permissionGetTree',
                        parms: {rootId: 0, withLeaf: false},
                        fun: $scope.getPageParm
                    }
                }
            );
        }

        var menu;

        function getLigerMenu(items) {
            menu = $.ligerMenu({
                width: 100,
                items: items
            });
        }

        function itemclick(item) {
            if (item.text == '编辑') {
                updatePermissions($scope.parm.id)
            }
        }

        /**
         * 加载列表
         */
        $scope.queryList = function (data) {

                $("#tables_con_show").ligerGrid({
                    columns: $rootScope.permissionsConfigColumns.columns,
                    url: globalConfig.api.queryListByParentIdPerm,
                    cssClass: "ligerClass",
                    isScroll: false,
                    headerRowHeight: 45,
                    rowHeight: 40,
                    // pageParmName: 'pageNum',
                    // pagesizeParmName: 'pageSize',
                    parms: data,
                    alternatingRow: false, //单双行差异去除
                    root: "data",
                    onAfterShowData: function (data) {
                        var gird1Width = $('.l-frozen .l-grid1').width();
                        $('.l-grid2').css({right: gird1Width, left: '0px', width: 'auto'});
                        $('.l-panel-bar').remove();
                        if (data.Total == '' || data.Total == null) {
                            // $('.fc-table-fix').append("<div class='no_data'><p>暂时没有数据</p></div>")
                        }

                    },
                    onBeforeShowData: function (data) {
                        if (data.Total == '' ||data.Total == null) {
                            $('.l-grid2').css('left', '0px')
                        }
                    },
                    onContextmenu: function (parm, e) {
                        $scope.parm = parm.data;
                        var items = [{
                            text: '编辑',
                            click: itemclick
                        }];
                        getLigerMenu(items);
                        menu.show({
                            top: e.pageY - e.offsetY
                        });
                        return false;
                    }
                })
        }


        // function getPageParm() {
        $scope.getPageParm = function (data) {
            if(data==undefined){
                data=0
            }else {
                data=data.data.id
            }
            $scope.closeOpen=data;
            dataService.getData('permissionQueryByParentId', {parentId: data, withUnuse: true}).success(function (rs) {
                var H = document.documentElement.clientHeight;
                var val = {
                    pageSize: Math.floor((H - 350) / 40)
                };
                if (val.pageSize <= 0) {
                    val.pageSize = 1
                }
                var page = Math.ceil(rs.data.length / val.pageSize);
                // if (page == 0||page == 1) {
                //     $('.bottomPage').remove()
                // }
                $('.tcdPageCode').createPage({
                    pageCount: page,
                    current: 1,
                    backFn: function (p) {
                        $scope.queryList({ pageNum: p,pageSize:val.pageSize,parentId: data, withUnuse: true})
                    }
                });
                $scope.queryList({ pageNum: 1,pageSize:val.pageSize,parentId: data, withUnuse: true})

            })

        }

        $scope.queryAll();


    }
])
;


/**
 * 删除权限弹窗
 */
function delPermissions(id, name) {
    var scope = angular.element($("#permissionsId")).scope();
    scope.$apply(function () {
        layer.confirm('你确定要删除"' + name + '"吗?', {}, function (index) {
            var params = {id: id, isGroup: false};
            $.ajax({
                type: 'GET',
                headers: {'ticket': Cookies.get('auth') || ''},
                url: '/wlgfapi/permission/delete',
                data: params,
                dataType: "json"
            }).done(function (data) {
                if (data.status == 200) {
                    layer.msg('设置成功!');
                    scope.queryAll();//重新加载页面数据
                } else {
                    layer.msg('设置失败!');
                }
            }).fail(function () {
                layer.msg('设置失败!');
            });
        })
    });

}

/**
 * 编辑权限信息弹窗
 * @param id 资源id
 * @param name
 */
function updatePermissions(id) {
    var scope = angular.element($("#permissionsId")).scope();
    scope.$apply(function () {
        scope.updateOpen = layer.open({
                title: '修改权限信息：',
                shade: [0.8, '#393D49'],
                shadeClose: true,
                maxmin: true,
                area: ['750px', '500px'],
                type: 2,
                content: '/index.html#/dialog/permissionsConfig/update/' + id
            }
        )
    });


}
