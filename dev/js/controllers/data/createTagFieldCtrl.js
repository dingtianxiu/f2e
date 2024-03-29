/**
 * 保存字段设置
 */
app.controller('createTagFieldCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'globalConfig', 'dataService', 'toaster',
    function ($scope, $state, $stateParams, $timeout, globalConfig, dataService, toaster) {
        var ctf = this;


        $scope.currentState = $state.current.name;

        $scope.urlId = $stateParams.labelGroupId;

        //操作按钮文字
        $scope.step = "下一个";

        //字符过长提示
        $scope.maxLength = true;

        //是否判断枚举值
        $scope.boolean = false;

        // 是否出现类目路径错误提示
        $scope.pathName = '';

        //标签 质量计算的提示
        $scope.tooltipBool = true;
        $scope.tooltip = "";

        // 初始字段列表
        $scope.fieldListData = [];

        // 字段详细信息
        $scope.fieldDetailData = {};

        // 下拉数据
        $scope.droplistData = {
            typeList: [], // 数据类型标签list
            '22': {
                tagList: [], // 标签的标签识别
                categoryL1List: [] // 标签的一级类目
            },
            '23': {
                tagList: [] // 维度的标签识别
            },
            labelLevelList: [{
                id: 1,
                name: '一级标签'
            }, {
                id: 2,
                name: '二级标签'
            }]
        };

        // 页面配置信息
        $scope.pageData = {
            curFieldId: '',
            rowIndex: 0,
            categoryL2List: []
        };

        $scope.nextIndex = 999;
        
        // 设置高度
        if($scope.currentState == 'g.data.createTagField'){
            $(".bq_wrap").css("height",$(window).height()-80);
        }else{
            $(".bq_wrap").css({"height":$(window).height(),"overflow":"hidden"});
            $(".mod_wrap").css("height",$(window).height()-80);
        };
        
        // 获取字段清单
        function getSimpleAdaptive() {

            var id = ($scope.initDataTableData && $scope.initDataTableData.id) ? $scope.initDataTableData.id : $stateParams.labelGroupId;
            var params = {
                rn: (new Date()).getTime()
            };
            var url = "queryLabelModifiesSimpleAdaptive";
            if ($scope.currentState == 'g.data.tagdetail') {
                url = "queryLabelsSimple";
                params.labelGroupId = id;
            } else {
                params.labelGroupModifyId = id;
            }

            dataService.getData(url, params).success(function (rs) {
                $scope.fieldListData = rs.data; // 设置初始字段列表
                $scope.fieldDetailData = angular.copy(rs.data[$scope.pageData.rowIndex]); // 设置默认第一项
                $scope.completeNum = 0;

                //获取已经完成数量
                angular.forEach(rs.data, function (item, index) {
                    if ('y' === item.isSuccess) {
                        $scope.completeNum++;
                    }
                });

                //循环获得左侧列表最小的下标
                $scope.nextIndex = 999;
                angular.forEach(rs.data, function (item, index) {
                    if (item.isSuccess !== 'y') {
                        if ($scope.nextIndex > index) {
                            $scope.nextIndex = index;
                        }
                    }
                });

                //设置最后一个为完成
                if ($scope.completeNum >= $scope.fieldListData.length - 1) {
                    $scope.step = "完成";
                    $(".creat-step>li:last-child").addClass("on").siblings().removeClass("on");
                }
                $scope.backfillField($scope.pageData.rowIndex);
                $scope.submitted = false;
            });
        }

        $scope.$on('backfillField', function(event,index) {
            $scope.backfillField(index);
        });
        $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
            //自动跳到下一个字段设置
            if ($scope.currentState == 'g.data.createTagField') {
                //$(".list-tr").eq($scope.nextIndex).trigger("click");
                if($scope.nextIndex!= 999){
                    $timeout(function(){
                        $scope.$emit('backfillField',$scope.nextIndex);
                    },100);
                }
                // getTagName($scope.fieldListData[$scope.nextIndex].metaColumnId);
            }
        });


        // 数据类型,   标签 || 维度
        function getTypeData() {

            // 发送请求之前先判断droplistData是否已经保存了数据
            if (!$scope.droplistData.typeList.length) { // 没有历史记录
                dataService.getData('queryByParentId', {
                    parentId: 21
                }).success(function (rs) {
                    // 放到droplist里面去
                    $scope.droplistData.typeList = rs.data;

                    // 获取标签识别list
                    getLabelTag();

                });
            } else {
                // 获取标签识别list
                getLabelTag();
            }
        }



        // 计算标签质量
        $scope.computeQuality = function () {
            if (/^\d+$/.test($scope.fieldDetailData.labelNonNull) && /^\d+$/.test($scope.fieldDetailData.labelTotal)) {
                if($scope.fieldDetailData.labelNonNull - $scope.fieldDetailData.labelTotal < 0){
                    $scope.tooltipBool = false;
                    $scope.tooltip = '=非空值不能大于总值';
                    $scope.fieldDetailData.labelQuality = null;
                }else{
                    $scope.fieldDetailData.labelQuality = ($scope.fieldDetailData.labelTotal / $scope.fieldDetailData.labelNonNull) * 100;
                    $scope.tooltip = '';
                    $scope.tooltipBool = true;
                }

            } else {
                $scope.fieldDetailData.labelQuality = null;

                if($scope.fieldDetailData.labelTotal !=null && $scope.fieldDetailData.labelNonNull!= null){
                    $scope.tooltipBool = false;
                    $scope.tooltip = '请输入整数';
                }else{
                    $scope.tooltipBool = false;
                    $scope.tooltip = '=条件错误,无法计算';
                }
                
            }
        };
        /**
         * 监听变量
         */
        $scope.$watch('fieldDetailData.labelTotal', function (newValue) {
            $scope.computeQuality();
        });
        $scope.$watch('fieldDetailData.labelNonNull', function (newValue) {
            $scope.computeQuality();
        });
        $scope.$watch('fieldDetailData.description', function (newValue) {
            if(newValue != null){
                $scope.textLength = newValue.length;
                if(newValue.length > 200){
                    $scope.maxLength = false;
                    $(".max-length").show();
                }else{
                    $scope.maxLength = true;
                    $(".max-length").hide();
                };
            }else{
                $scope.textLength = 0;
            };
            
        });
        $scope.$watch('fieldDetailData.enumType', function (newValue) {
            if (newValue == 'n') {
                $scope.boolean = false;
            } else {
                $scope.boolean = true;
            }
        });


        // 获取标签识别
        function getLabelTag() {
            // 发送请求之前先判断droplistData是否已经保存了数据
            if (!$scope.droplistData[$scope.fieldDetailData.type].tagList.length) { // 没有历史记录
                dataService.getData('queryByParentId', {
                    parentId: $scope.fieldDetailData.type
                }).success(function (rs) {
                    $scope.droplistData[$scope.fieldDetailData.type].tagList = rs.data;
                    $scope.fieldDetailData.tag = $scope.fieldDetailData.tag === null ? rs.data[0].id : $scope.fieldDetailData.tag;
                });
            } else {
                $scope.fieldDetailData.tag = $scope.fieldDetailData.tag === null ? $scope.droplistData[$scope.fieldDetailData.type].tagList[0].id : $scope.fieldDetailData.tag;
            }
        }


        /**
         * 初始化下拉树方法
         * @param option
         */
        $scope.comboBoxInit = function (option) {
            $scope.safeApply(function () {
                $scope.comboBoxOption = {
                    url: option.url,
                    parms: option.parms || {
                        rootId: 0,
                        state: option.state
                    },
                    width: option.width || 398,
                    delValue: option.delValue == 'undefined' ? 0 : option.delValue,
                    onSelected: option.onSelected
                }
            });
        };

        $scope.selectedNode = null;
        $scope.getSelectedOne = function (treeData, value, node) {
            if (!node) {
                angular.forEach(treeData, function (item) {
                    if (value == item.id) {
                        $scope.selectedNode = item;
                    } else {
                        if (item.children && !node) {
                            $scope.getSelectedOne(item.children, value, node);
                        }
                    }
                });
            }
        };

        //点击下拉树回调函数
        $scope.categoryPath = '';
        $scope.treeCallBackFun = function (value) {
               $scope._categoryPath = '';
               $scope.selectedNode = {
                   parentId: value
               };
               while ($scope.selectedNode.parentId != 1 && $scope.selectedNode.parentId) {
                   var value = $scope.selectedNode.parentId
                   $scope.selectedNode = null;
                   $scope.getSelectedOne($scope.comboBoxOption.treeData, value, $scope.selectedNode);
                   $scope._categoryPath = $scope._categoryPath === '' ? $scope.selectedNode.name : $scope.selectedNode.name + '>' + $scope._categoryPath;
               }
               angular.element('#creatCategory').text($scope._categoryPath);
        };

        /**
         * 通过字段id获取标签的详细信息，并回填信息
         * 获取类目下拉树
         * @param rootId
         */

        function getLabelDetail(metaColumnId) {
            var url = 'getLabelModifyAdaptive';
            if ($scope.currentState == 'g.data.tagdetail') {
                url = "getLabelByMetaColumnId";
            }

            dataService.getData(url, {
                metaColumnId: metaColumnId
            }).success(function (rs) {
                // 获取标签等级下拉
                if (rs.data != null) {
                    $scope.fieldDetailData = rs.data;
                    if (rs.data.labelLevel) {
                        $scope.fieldDetailData.labelLevel = parseInt(rs.data.labelLevel);
                    }
                    // 填充标签类目路径
                    if ($scope.fieldDetailData.category != null) {
                        getLabelPath($scope.fieldDetailData.category);
                    }else{
                        angular.element('#creatCategory').text('');
                        angular.element('#createSelectCategory_txt').val('');
                    }
                    $scope.comboBoxInit({
                        url: 'getCategoryTree',
                        delValue: rs.data.category,
                        parms: {
                            rootId: 24
                        },
                        onBeforeSelect: $scope.treeCallBackFun,
                        onSelected: $scope.treeCallBackFun
                    });
                }
                $('#createSelectCategory').val('');
                getTypeData();
            });
        }

        //获取类目路径
        function getLabelPath(id) {
            //访问接口
            dataService.getData('getLabelPath', {
                id: id
            }).success(function (rs) {
                $scope.pathName = rs.data.pathName;
                angular.element('#creatCategory').text($scope.pathName);
            });
        }
        // 改变数据类型
        $scope.changeDataType = function () {
            $scope.fieldsubmitted = false;

            $scope.fieldDetailData.tag = null;
            $scope.fieldDetailData.categoryL1 = null;
            $scope.fieldDetailData.categoryL2 = null;
            // 获取标签识别list
            getLabelTag();
        };

        /**
         * 验证标签是否有填写完整
         * @param data
         * @param index
         */
        $scope.checkIsCompleted = function(data,index){
            //是否全部设置完成了
            $scope.flag = false;
            $scope.completeNum = 0;
            angular.forEach(data, function (item, _index) {
                //还有未设置完成的字段 ，并且该字段
                if (item.isSuccess !== 'y' && _index != index) {
                    $scope.flag = true;
                }
                if (item.isSuccess == 'y' ) {
                    $scope.completeNum++;
                }
            });
            if($scope.flag){
                $scope.step = '下一个';
            }else{
                if(data.length - $scope.completeNum <=1){
                    $scope.step = '完成';
                }
            }
        }


        // 回填字段详情信息到右侧表单
        $scope.backfillField = function (index) {
            $scope.fieldsubmitted = false;

            if ($scope.currentState == 'g.data.createTagField') {
                $scope.typeLabelForm.$setPristine();
            }

            $scope.pageData.rowIndex = index;

            $scope.fieldDetailData.tag = null;
            getTagName($scope.fieldListData[index].metaColumnId);
            $scope.tagName = $scope.fieldListData[index].metaColumnName;

            $scope.checkIsCompleted($scope.fieldListData,index);

            if ($scope.fieldListData[$scope.pageData.rowIndex].type === null) { // 未设置，默认进入设置数据类型为标签的模式

                $scope.fieldDetailData = angular.copy($scope.fieldListData[$scope.pageData.rowIndex]);

                $scope.fieldDetailData.type = 22;
                // 获取数据类型list，
                 getTypeData();
                $scope.comboBoxInit({
                    url: 'getCategoryTree',
                    parms: {
                        rootId: 24
                    },
                     onBeforeSelect: $scope.treeCallBackFun,
                     onSelected: $scope.treeCallBackFun
                });

                $timeout(function() {
                    $scope.pathName = '';
                    angular.element('#creatCategory').text("");
                    angular.element('#createSelectCategory_txt').val('');
                }, 100);

                $scope.fieldDetailData.description = '';
                //return;
            } else { // 标签维度等数据反填  修改
                if($scope.fieldListData[$scope.pageData.rowIndex].type !== null ){
                    getLabelDetail($scope.fieldListData[index].metaColumnId);
                }

            }
        };

        //获取中文名  英文名
        function getTagName(id) {
            //访问接口
            dataService.getData('getLabelCodeName', {
                id: id
            }).success(function (rs) {
                $scope.getLabelCodeName = rs.data;
                $scope.getLabelCodeName.codeName = rs.data.code;
                $scope.getLabelCodeName.chineseName = rs.data.name;
            });
        }
        // 保存字段信息
        $scope.saveLabel = function () {

            if( $scope.fieldDetailData.labelQuality ){
                $scope.fieldDetailData.labelQuality = parseFloat($scope.fieldDetailData.labelQuality).toFixed(2);
            }
            var _fd = $scope.fieldDetailData;
            $scope.fieldsubmitted = true;
            if (($scope.typeLabelForm && $scope.typeLabelForm.$valid && $scope.maxLength) || _fd.type == 23) {
                if ($scope.currentState === 'g.data.createTagField') { //新增
                    //标签和主键字段分开提交
                    if (_fd.type == 22) {
                        if ($('#createSelectCategory').val() == '' || $('#createSelectCategory').val() == null) {
                            $scope.categoryTips = false;
                            toaster.pop({
                                type: 'error',
                                title: '',
                                body: '标签类名未选择',
                                timeout: 2000
                            });
                            return false;
                        }
                        if(!$scope.tooltipBool){
                            toaster.pop({
                                type: 'error',
                                title: '',
                                body: '标签质量填写有误',
                                timeout: 2000
                            });
                            return;
                        }
                        var _postData = {
                            id: _fd.id,
                            code: $scope.getLabelCodeName.codeName,
                            name: $scope.getLabelCodeName.chineseName,
                            labelGroupId: _fd.labelGroupId,
                            // targetId: _fd.targetId,
                            metaColumnId: _fd.metaColumnId,
                            metaColumnName: _fd.metaColumnName,
                            type: _fd.type,
                            isSuccess: 'y',
                            description: _fd.description,
                            isFact: _fd.isFact,
                            enumType: _fd.enumType,
                            enumValue: _fd.enumValue || '',
                            labelTotal: _fd.labelTotal,
                            labelNonNull: _fd.labelNonNull,
                            labelQuality: _fd.labelQuality,
                            labelLevel: _fd.labelLevel,
                            category: $('#createSelectCategory').val()
                        }
                    } else {
                        var _postData = {
                            id: _fd.id,
                            labelGroupId: $scope.urlId,
                            metaColumnId: _fd.metaColumnId,
                            type: _fd.type,
                            isSuccess: 'y',
                            tag: _fd.tag
                        }
                    }

                    var _postUrl = 'createLabel';
                    if ($scope.currentState === 'g.data.createTagField') {
                        if (_fd.id) {
                            _postUrl = 'modifyLabel';
                        } else {
                            _postUrl = 'createLabel';
                        }
                    } else if ($scope.currentState === 'g.data.modifyTag') {
                        _postUrl = 'modifyLabel'
                    }

                    dataService.postData(_postUrl, _postData).success(function (rs) {
                        if (rs.status === 200) {
                            toaster.clear();
                            toaster.pop({
                                type: 'success',
                                title: '',
                                body: rs.msg,
                                timeout: 2000
                            });
                            $scope.submitted = true;

                            //标记为已完成
                            if (_fd.isSuccess != 'y') {
                                $scope.completeNum++;
                            }
                            getSimpleAdaptive();
                            if ($scope.step == "完成") {
                                submitAudit();
                            }
                        }
                    });
                } else { //修改
                    //标签和主键字段分开提交
                    if (_fd.type == 22) {
                        if ($('#createSelectCategory').val() == '' || $('#createSelectCategory').val() == null) {
                            $scope.categoryTips = false;
                            toaster.pop({
                                type: 'error',
                                title: '',
                                body: '标签类名未选择',
                                timeout: 2000
                            });
                            return false;
                        }
                        if(!$scope.tooltipBool){
                            toaster.pop({
                                type: 'error',
                                title: '',
                                body: '标签质量填写有误',
                                timeout: 2000
                            });
                            return;
                        }
                        var _postData = {
                            id: _fd.id || '',
                            labelGroupId: _fd.labelGroupId,
                            targetId: _fd.targetId,
                            metaColumnId: _fd.metaColumnId,
                            metaColumnName: _fd.metaColumnName,
                            type: _fd.type,
                            code: $scope.getLabelCodeName.codeName,
                            name: $scope.getLabelCodeName.chineseName,
                            // tag: _fd.tag,
                            isSuccess: 'y',
                            description: _fd.description,
                            isFact: _fd.isFact,
                            enumType: _fd.enumType,
                            enumValue: _fd.enumValue,
                            labelTotal: _fd.labelTotal,
                            labelNonNull: _fd.labelNonNull,
                            labelQuality: _fd.labelQuality,
                            labelLevel: _fd.labelLevel,
                            category: $('#createSelectCategory').val()
                        }
                    } else {
                        var _postData = {
                            id: _fd.id || '',
                            isSuccess: 'y',
                            labelGroupId: _fd.labelGroupId,
                            metaColumnId: _fd.metaColumnId,
                            metaColumnName: _fd.metaColumnName,
                            type: _fd.type,
                            tag: _fd.tag
                        }
                    }
                    //return;

                    var _postUrl = 'createLabel';
                    if ($scope.currentState === 'g.data.createTagField') {
                        if (_fd.id) {
                            _postUrl = 'modifyLabel';
                        } else {
                            _postUrl = 'createLabel';
                        }
                    } else if ($scope.currentState === 'g.data.modifyTag') {
                        _postUrl = 'modifyLabel'
                    }
                    if($scope.initDataTableData.modifyStatus=='deployed'){
                        toaster.pop({
                            type: 'error',
                            title: '',
                            body: '已部署标签源未修改，标签不可以修改',
                            timeout: 2000
                        });
                    }
                    dataService.postData(_postUrl, _postData).success(function (rs) {
                        if (rs.status === 200) {
                            toaster.clear();
                            toaster.pop({
                                type: 'success',
                                title: '',
                                body: rs.msg,
                                timeout: 2000
                            });
                            $scope.submitted = true;

                            getSimpleAdaptive();

                            if ($scope.step == "完成") {
                                submitAudit();
                            }
                        }
                    });
                }
            } else {
                toaster.clear();
                toaster.pop({
                    type: 'error',
                    title: '',
                    body: '有未设置的字段，请设置全后再提交',
                    timeout: 2000
                });
            }
        };

        //取消按钮
        $scope.cancelTag = function () {
            $(".mask").show();
        };
        //继续设置
        $scope.next = function () {
            $(".mask").hide();
        };

        // 提交审核
        function submitAudit() {
            $scope.modifyId = '';
            if ($scope.currentState === 'g.data.createTagField') {
                $scope.modifyId = $stateParams.labelGroupId;
            }else if($scope.currentState === 'g.data.modifyTag'){
                $scope.modifyId = $scope.initDataTableData.id;
            }

            // 验证左侧是否全部填写完成
            var _modifyItemCount = 0;
            for (var i = 0; i < $scope.fieldListData.length; i++) {
                _modifyItemCount = $scope.fieldListData[i].type ? _modifyItemCount + 1 : _modifyItemCount;
            }
            // if (_modifyItemCount === $scope.fieldListData.length) {
            dataService.postData('submitAudit', {
                //labelGroupModifyId: $stateParams.labelGroupId
                labelGroupModifyId: $scope.modifyId
            }).success(function (rs) {
                if (rs.status === 200) {
                    toaster.clear();
                    $state.go('g.data.tagconfig');
                }
            });
        }
//todo
        //提交 审核不跳转方法
        function submitAuditNoRun() {
            $scope.modifyId = '';
            if ($scope.currentState === 'g.data.createTagField') {
                $scope.modifyId = $stateParams.labelGroupId;
            }else if($scope.currentState === 'g.data.modifyTag'){
                $scope.modifyId = $scope.initDataTableData.id;
            }

            // 验证左侧是否全部填写完成
            var _modifyItemCount = 0;
            for (var i = 0; i < $scope.fieldListData.length; i++) {
                _modifyItemCount = $scope.fieldListData[i].type ? _modifyItemCount + 1 : _modifyItemCount;
            }
            dataService.postData('submitAudit', {
                labelGroupModifyId: $scope.modifyId
            }).success(function (rs) {
                if (rs.status === 200) {
                    toaster.clear();
                }
            });
        }
        $scope.$on('transfertype', function(event, data) {
            if( $scope.fieldDetailData.labelQuality ){
                $scope.fieldDetailData.labelQuality = parseFloat($scope.fieldDetailData.labelQuality).toFixed(2);
            }
            var _fd = $scope.fieldDetailData;
            $scope.fieldsubmitted = true;
            if (($scope.typeLabelForm && $scope.typeLabelForm.$valid && $scope.maxLength) || _fd.type == 23) {
                if ($scope.currentState === 'g.data.createTagField') { //新增
                    //标签和主键字段分开提交
                    if (_fd.type == 22) {
                        if ($('#createSelectCategory').val() == '' || $('#createSelectCategory').val() == null) {
                            $scope.categoryTips = false;
                            toaster.pop({
                                type: 'error',
                                title: '',
                                body: '标签类名未选择',
                                timeout: 2000
                            });
                            return false;
                        }
                        if(!$scope.tooltipBool){
                            toaster.pop({
                                type: 'error',
                                title: '',
                                body: '标签质量填写有误',
                                timeout: 2000
                            });
                            return false;
                        }
                        var _postData = {
                            id: _fd.id,
                            code: $scope.getLabelCodeName.codeName,
                            name: $scope.getLabelCodeName.chineseName,
                            labelGroupId: _fd.labelGroupId,
                            // targetId: _fd.targetId,
                            metaColumnId: _fd.metaColumnId,
                            metaColumnName: _fd.metaColumnName,
                            type: _fd.type,
                            isSuccess: 'y',
                            description: _fd.description,
                            isFact: _fd.isFact,
                            enumType: _fd.enumType,
                            enumValue: _fd.enumValue || '',
                            labelTotal: _fd.labelTotal,
                            labelNonNull: _fd.labelNonNull,
                            labelQuality: _fd.labelQuality,
                            labelLevel: _fd.labelLevel,
                            category: $('#createSelectCategory').val()
                        }
                    } else {
                        var _postData = {
                            id: _fd.id,
                            labelGroupId: $scope.urlId,
                            metaColumnId: _fd.metaColumnId,
                            type: _fd.type,
                            isSuccess: 'y',
                            tag: _fd.tag
                        }
                    }

                    var _postUrl = 'createLabel';
                    if ($scope.currentState === 'g.data.createTagField') {
                        if (_fd.id) {
                            _postUrl = 'modifyLabel';
                        } else {
                            _postUrl = 'createLabel';
                        }
                    } else if ($scope.currentState === 'g.data.modifyTag') {
                        _postUrl = 'modifyLabel'
                    }

                    dataService.postData(_postUrl, _postData).success(function (rs) {
                        if (rs.status === 200) {
                            toaster.clear();
                            toaster.pop({
                                type: 'success',
                                title: '',
                                body: rs.msg,
                                timeout: 2000
                            });
                            $scope.submitted = true;

                            //标记为已完成
                            if (_fd.isSuccess != 'y') {
                                $scope.completeNum++;
                            }
                            getSimpleAdaptive();
                            if ($scope.step == "完成") {
                                submitAuditNoRun();
                            }
                        }
                    });
                } else { //修改
                    //标签和主键字段分开提交
                    if (_fd.type == 22) {
                        if ($('#createSelectCategory').val() == '' || $('#createSelectCategory').val() == null) {
                            $scope.categoryTips = false;
                            toaster.pop({
                                type: 'error',
                                title: '',
                                body: '标签类名未选择',
                                timeout: 2000
                            });
                            return false;
                        }
                        if(!$scope.tooltipBool){
                            toaster.pop({
                                type: 'error',
                                title: '',
                                body: '标签质量填写有误',
                                timeout: 2000
                            });
                            return false;
                        }
                        var _postData = {
                            id: _fd.id || '',
                            labelGroupId: _fd.labelGroupId,
                            targetId: _fd.targetId,
                            metaColumnId: _fd.metaColumnId,
                            metaColumnName: _fd.metaColumnName,
                            type: _fd.type,
                            code: $scope.getLabelCodeName.codeName,
                            name: $scope.getLabelCodeName.chineseName,
                            // tag: _fd.tag,
                            isSuccess: 'y',
                            description: _fd.description,
                            isFact: _fd.isFact,
                            enumType: _fd.enumType,
                            enumValue: _fd.enumValue,
                            labelTotal: _fd.labelTotal,
                            labelNonNull: _fd.labelNonNull,
                            labelQuality: _fd.labelQuality,
                            labelLevel: _fd.labelLevel,
                            category: $('#createSelectCategory').val()
                        }
                    } else {
                        var _postData = {
                            id: _fd.id || '',
                            isSuccess: 'y',
                            labelGroupId: _fd.labelGroupId,
                            metaColumnId: _fd.metaColumnId,
                            metaColumnName: _fd.metaColumnName,
                            type: _fd.type,
                            tag: _fd.tag
                        }
                    }
                    //return;

                    var _postUrl = 'createLabel';
                    if ($scope.currentState === 'g.data.createTagField') {
                        if (_fd.id) {
                            _postUrl = 'modifyLabel';
                        } else {
                            _postUrl = 'createLabel';
                        }
                    } else if ($scope.currentState === 'g.data.modifyTag') {
                        _postUrl = 'modifyLabel'
                    }
                    if($scope.initDataTableData.modifyStatus=='deployed'){
                        toaster.pop({
                            type: 'error',
                            title: '',
                            body: '已部署标签源未修改，标签不可以修改',
                            timeout: 2000
                        });
                        return false
                    }
                    dataService.postData(_postUrl, _postData).success(function (rs) {
                        if (rs.status === 200) {
                            toaster.clear();
                            toaster.pop({
                                type: 'success',
                                title: '',
                                body: rs.msg,
                                timeout: 2000
                            });
                            $scope.submitted = true;

                            getSimpleAdaptive();

                            if ($scope.step == "完成") {
                                submitAuditNoRun();
                            }
                        }
                    });
                }
            } else {
                toaster.clear();
                toaster.pop({
                    type: 'error',
                    title: '',
                    body: '有未设置的字段，请设置全后再提交',
                    timeout: 2000
                });
                return false
            }
        });


        // 初始获取左侧列表
        getSimpleAdaptive();
    }
]);