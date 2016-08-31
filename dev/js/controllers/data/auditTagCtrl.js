/**
 * 审核标签组
 */
app.controller('auditTagCtrl', ['$scope', '$state', '$stateParams', '$cookies', 'globalConfig', 'dataService',  'toaster',
  function($scope, $state, $stateParams, $cookies, globalConfig, dataService,  toaster) {

    var _id = $stateParams.labelGroupId || ''; // 标签组Id

    $scope.submited = false;

    //字符过长提示
    $scope.maxLength = true;

    // 上传状态等
    $scope.upload = {
      uploadScrpit: {
        status: false,
        progress: 0,
        fileName: ''
      },
      uploadAttachment: {
        status: false,
        progress: 0,
        fileName: ''
      }
    }


    // 页面配置
    $scope.pageData = {
      loadingFieldPage: ''
    }

    // 数据表信息
    $scope.initDataTableData = {};
    $scope.initTagTableData = {};

    // 数据表下拉等信息
    $scope.dataTableListData = {
      metaDbIdList: [],
      metaTableIdList: [],
      dataSourceList: [],
      refreshCycleList: []
    };

    // 审核信息post数据
    $scope.auditPostData = {
      auditStatus: 'n',
      comment: '',
      labelGroupId: _id
    }
    // 设置高度
    $(".bq_wrap").css("height",$(window).height()-80);

    // 获取数据组表信息
    function getDataTableData() {
      dataService.getData('getLabelGroupModifyAdaptive', {
        id: _id
      }).success(function(rs) {
        $scope.initDataTableData = rs.data;
        $scope.initDataTableData.modifyComment = rs.data.modifyComment;
        $scope.initDataTableData.id = rs.data.id;
        // 设置脚本地址
        $scope.initDataTableData.uploadScrpitUrl = globalConfig.api.downloadFile + '/' + rs.data.scriptFileUid + '?ticket=' + $cookies.get('auth');
        $scope.initDataTableData.attachmentFileUrl = globalConfig.api.downloadFile + '/' + rs.data.attachmentFileUid + '?ticket=' + $cookies.get('auth');
        $scope.pageData.loadingFieldPage = './views/data/createTag.field.html'; // 设置字段
        getDatabase();
        //getTagTable($scope.initDataTableData.id,"audit");
      });
    };
    getDataTableData();


    //监控输入字符
    $scope.$watch('auditPostData.comment', function (newValue) {
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
        }
        
    });

    //获取字段标签所有数据，生成表格
    function getTagTable(id,flag) {
      dataService.getData('queryLabelsByLabelGroupId', {
        labelGroupId: id,
        flag:flag
      }).success(function(rs) {
        $scope.initTagTableData = rs.data;
        $scope.tagTableData = [];
        $scope.keyTableData = [];
        for(i=0 ;i<$scope.initTagTableData.length ;i++){
          if($scope.initTagTableData[i].type == 22){
            $scope.tagTableData.push($scope.initTagTableData[i]);

            if($scope.initTagTableData[i].labelLevel == 1){
              $scope.initTagTableData[i].labelLevelName ="一级标签";
            }else{
              $scope.initTagTableData[i].labelLevelName ="二级标签";
            };
            if($scope.initTagTableData[i].isFact == 'y'){
              $scope.initTagTableData[i].isFactName ="是";
            }else{
              $scope.initTagTableData[i].isFactName ="否";
            };
            if($scope.initTagTableData[i].labelQuality != null){
              $scope.initTagTableData[i].labelQualityPer =$scope.initTagTableData[i].labelQuality.toFixed(2) + '%';
            }
          }else{
            $scope.keyTableData.push($scope.initTagTableData[i]);
          };
          
        };
        
      });
    };
    getTagTable(_id);
    

    // 获取数据库名
    function getDatabase() {
      dataService.getData('queryDbsByCategoryId', {
        categoryId: $scope.initDataTableData.dataCategory
      }).success(function(rs) {
        $scope.dataTableListData.metaDbIdList = rs.data;
        getTable();
        renderSource();
      });
    };

    // 获取表名
    function getTable() {
      dataService.getData('queryTablesByDbId', {
        metaDbId: $scope.initDataTableData.metaDbId
      }).success(function(rs) {
        $scope.dataTableListData.metaTableIdList = rs.data;
      });
    };

    // 数据源联动
    function renderSource() {
      dataService.getData('queryByParentId', {
        parentId: $scope.initDataTableData.dataCategory
      }).success(function(rs) {
        $scope.dataTableListData.dataSourceList = rs.data;
      });
    };


    // 更新周期
    function getCycle() {
      dataService.getData('queryByParentId', {
        parentId: 14
      }).success(function(rs) {
        $scope.dataTableListData.refreshCycleList = rs.data;
      });
    };
    getCycle();

    //取消按钮
    $scope.cancel = function (){
      $(".mask").show();
    };
    $scope.next = function (){
      $(".mask").hide();
    };

    
    
    
    //  保存审核
    $scope.saveAudit = function() {
      if($scope.auditPostData.comment==null || $scope.auditPostData.comment=='') {
        toaster.pop({
          type: 'error',
          title: '',
          body: '请填写审核意见！',
          showCloseButton: false
        });
        return false;
      }
      $scope.submited = true;
      dataService.postData('audit', $scope.auditPostData).success(function(rs) {
        if (rs.status === 200) {
          toaster.clear();
          toaster.pop({
            type: 'success',
            title: '',
            body: rs.msg,
            timeout: 500,
            onHideCallback: function() {
              $state.go('g.data.tagconfig');
            }
          });
        }
      });
    }


  }
]);
