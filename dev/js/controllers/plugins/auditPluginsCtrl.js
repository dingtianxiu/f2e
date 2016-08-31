/**
 * 新建控件
 */
app.controller('auditPluginsCtrl', ['$scope', '$cookies', '$timeout', '$stateParams', '$state', '$rootScope', 'globalConfig', 'dataService', 'toaster',
  function($scope, $cookies, $timeout, $stateParams, $state,$rootScope, globalConfig, dataService, toaster) {

    var _id = $stateParams.id || ''; //id

    // 表单数据
    $scope.formData = {};

    //字符过长提示
    $scope.maxLength = true;

    //监控输入字符
    $scope.$watch('auditData.comment', function (newValue) {
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
    // 设置高度
    $(".bq_wrap").css("height",$(window).height()-227);
    // 页面配置
    $scope.pageData = {
      step: 1, // 步骤状态
      previewChartUrl: '/chartPreview.html',
      checkChart: '?',
      categoryList: [],
      baseLibList: [],
      sampleList: [],
      currentSample: null,
      currentSampleIndex: 0
    }

    // 临时显示数据
    $scope.tempShowData = {
      thumbnail: null,
      previewTabIndex: 0
    }

    // 转化缩略图
    $scope.exchangeThumbnailUrl = function(uid) {
      if (uid) {
        return globalConfig.api.getres + '/' + uid + '?ticket=' + $cookies.get('auth');
      }
    }

    // 更新提交预览的状态
    $scope.updateValid = function(val) {
      $scope.pageData.checkChart = val;
      $scope.$apply();
    }
    $scope.$watch('pageData.checkChart', function(data) {
      if(false==data){
        toaster.pop({
          type: 'error',
          title: '',
          body: '预览失败',
          showCloseButton: false
        });
      }
    });

    // 实例数据
    $scope.sampleData = [];

    // 只读编辑器
    $scope.editorReadonlyOptions = {
      lineWrapping: true,
      lineNumbers: true,
      lang: "js",
      readOnly: 'nocursor',
      mode: {
        name: "javascript",
        json: true
      }
    };

    // 获取控件信息
    function getWigdetInfo(id) {
      dataService.getData('getWidgetModifyAdaptive', {
        id: id
      }).success(function(rs) {
        $scope.formData = rs.data;
        getSampleData(id);
      });
    }
    getWigdetInfo(_id);

    // 获取实例
    function getSampleData(widgetId) {
      dataService.getData('widgetListById', {
        widgetId: widgetId
      }).success(function(rs) {
        $scope.sampleData = rs.data;
        $timeout(function () {
          $scope.formData.ticket = $cookies.get('auth');
          $scope.formData.sampleStyle = rs.data[$scope.pageData.currentSampleIndex].sampleStyle;
          $scope.formData.sampleData = rs.data[$scope.pageData.currentSampleIndex].sampleData;
          $scope.formData.thumbnailFileUid = rs.data[$scope.pageData.currentSampleIndex].thumbnailFileUid;
          
          document.getElementById('chartPreviewIframe').contentWindow.updatedata($scope.formData);
        },1000);
      });
    }

    // 审核需提交的数据
    $scope.auditData = {
      boolStatus: 'y'
    }

    /**
     * 审核控件
     * @return {[type]} [description]
     */
    $scope.auditWidget = function() {
      $scope.auditData.modifyId = $scope.formData.id;

        // 保存数据
      dataService.postData('auditWidget', $scope.auditData).success(function(rs) {
        if (rs.status === 200) {
          $state.go('g.plugins.pre');
        }
      });
    }
 $scope.cancelTag = function() {
      $(".mask").show();
    };
    //继续设置
    $scope.next = function() {
      $(".mask").hide();
    };
  }
]);
