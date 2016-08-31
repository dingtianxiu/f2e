/**
 * 保存字段设置
 */
app.controller('modifyTagCtrl', ['$scope', '$state', '$stateParams', '$cookies', 'globalConfig', 'dataService', 'FileUploader', 'toaster',
  function($scope, $state, $stateParams, $cookies, globalConfig, dataService, FileUploader, toaster) {
    var _id = $stateParams.labelGroupId || ''; // 标签组Id


    // 上传状态等
    $scope.upload = {
      uploadScrpit: {
        status: 0,
        progress: 0,
        fileName: ''
      },
      uploadAttachment: {
        status: 0,
        progress: 0,
        fileName: ''
      }
    }

    // 页面配置
    $scope.pageData = {
      loadingFieldPage: ''
    }

     $scope.initPage = {
       showTable:true
     }
     $scope.changeTab = function(bool){
       $scope.initPage.showTable = bool;
       if(bool==true){
         //TODO
         $scope.checkLoggedIn()
       }else {
         $scope.modifyTagSaveNoRun();
       }
     }
    $scope.checkLoggedIn = function() {
      $scope.$broadcast('transfertype', '1111111');
    }


    // 数据表信息
    $scope.initDataTableData = {};

    // 数据表下拉等信息
    $scope.dataTableListData = {
      metaDbIdList: [],
      metaTableIdList: [],
      dataSourceList: [],
      refreshCycleList: []
    };

    // 获取数据组表信息
    function getDataTableData() {
      dataService.getData('createLabelGroupModify', {
        labelGroupId: _id
      }).success(function(rs) {
        $scope.initDataTableData = rs.data;

        if($scope.initDataTableData.dataCategory == 6){
          $scope.dataName = "运营商标签";
        }else{
          $scope.dataName = "舆情标签";
        };
         
        if (rs.data.scriptFileUid) {
          // 设置上传等信息
          $scope.upload.uploadScrpit.status = 2;
          $scope.upload.uploadScrpit.progress = 100;
          $scope.upload.uploadScrpit.fileName = rs.data.scriptFileName;
        }

        if (rs.data.attachmentFileUid) {
          // 设置附件等信息
          $scope.upload.uploadAttachment.status = 2;
          $scope.upload.uploadAttachment.progress = 100;
          $scope.upload.uploadAttachment.fileName = rs.data.attachmentFileName;
        }


        //审核结果
        if(rs.data.modifyStatus == "wait_audit"){
          $scope.initDataTableData.result = "待审核";
        }else if(rs.data.modifyStatus == "audit_pass"){
          $scope.initDataTableData.result = "审核通过";
        }else if(rs.data.modifyStatus == "audit_not_pass"){
          $scope.initDataTableData.result = "审核未通过";
        }else{
          $scope.initDataTableData.result = "已部署";
        };

        $scope.pageData.loadingFieldPage = './views/data/createTag.field.html'; // 设置字段

        getDatabase();
      });
    }
    getDataTableData();

    // 获取数据库名
    function getDatabase() {
      dataService.getData('queryDbsByCategoryId', {
        categoryId: $scope.initDataTableData.dataCategory
      }).success(function(rs) {
        $scope.dataTableListData.metaDbIdList = rs.data;
        getTable();
        renderSource();
      });
    }

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

    // 上传脚本
    var uploaderScript = $scope.uploaderScript = new FileUploader({
      url: globalConfig.api.uploadFile+'?type=script',
      autoUpload: true,
      queueLimit: 1,
      headers: {
        ticket: $cookies.get('auth')
      },
      removeAfterUpload: true,
      onWhenAddingFileFailed: function(item, filter, options) { // 上传前失败
        toaster.clear();
        if (filter.name == 'enforceMaxFileSize') {
          toaster.pop({
            type: 'error',
            title: '',
            body: '上传文件大小超过20M',
            showCloseButton: false
          });
        }

        if (filter.name == 'scriptfileType') {
          toaster.pop({
            type: 'error',
            title: '',
            body: '文件格式应为txt,sh,py,pyc,pyo,pyd,jar,class,dll中的一种',
            showCloseButton: false
          });
        }
        $('#uploaderScriptid').val('');
      },
      onProgressItem: function(item, progress) {
        $scope.upload.uploadScrpit.status = 1;
      },
      onSuccessItem: function(item, response, status, headers) { // 上传成功
        if (status === 200 && response.status === 200) {
          $scope.upload.uploadScrpit.status = 2; // 上传完成
          $scope.upload.uploadScrpit.fileName = response.data.name; // 文件名
          $scope.initDataTableData.scriptFileUid = response.data.uid;
          $('#uploaderScriptid').val('');
        } else if (status === 200 && response.status === 503) {
          $scope.upload.uploadScrpit.status = 0; // 上传完成
          toaster.clear();
          toaster.pop({
              type: 'error',
              title: '',
              body: response.msg,
              showCloseButton: false,
          });
          $('#uploaderScriptid').val('');
        }
      }
    });
    uploaderScript.filters.push({
      'name': 'enforceMaxFileSize',
      'fn': function(item) {
        return item.size <= 20971520; // 20 MiB to bytes
      }
    });
    uploaderScript.filters.push({
      'name': 'scriptfileType',
      'fn': function(item) {
        return /^.*?\.(txt|sh|py|pyc|pyo|pyd|jar|class|dll)$/.test(item.name)
      }
    });

    // 上传附件
    var uploaderAttachment = $scope.uploaderAttachment = new FileUploader({
      url: globalConfig.api.uploadFile+'?type=attachment',
      autoUpload: true,
      queueLimit: 1,
      headers: {
        ticket: $cookies.get('auth')
      },
      removeAfterUpload: true,
      onWhenAddingFileFailed: function(item, filter, options) { // 上传前失败
        toaster.clear();
        if (filter.name == 'enforceMaxFileSize') {
          toaster.pop({
            type: 'error',
            title: '',
            body: '上传文件大小超过20M',
            showCloseButton: false
          });
        }

        if (filter.name == 'scriptfileType') {
          toaster.pop({
            type: 'error',
            title: '',
            body: '文件格式应为doc,docx,xls,xlsx,sql,zip,rar中的一种',
            showCloseButton: false
          });
        }
        $('#uploaderAttachmentid').val('');
      },
      onProgressItem: function(item, progress) {
        $scope.upload.uploadAttachment.status = 1;
      },
      onSuccessItem: function(item, response, status, headers) { // 上传成功
        if (status === 200 && response.status === 200) {
          $scope.upload.uploadAttachment.status = 2; // 上传完成
          $scope.upload.uploadAttachment.fileName = response.data.name; // 文件名
          $scope.initDataTableData.attachmentFileUid = response.data.uid;
          $('#uploaderAttachmentid').val('');
        } else if (status === 200 && response.status === 503) {
          $scope.upload.uploadAttachment.status = 0; // 上传完成
          toaster.clear();
          toaster.pop({
              type: 'error',
              title: '',
              body: response.msg,
              showCloseButton: false,
          });
          $('#uploaderAttachmentid').val('');
        }
      }
    });
    uploaderAttachment.filters.push({
      'name': 'enforceMaxFileSize',
      'fn': function(item) {
        return item.size <= 20971520; // 20 MiB to bytes
      }
    });
    uploaderAttachment.filters.push({
      'name': 'scriptfileType',
      'fn': function(item) {
        return /^.*?\.(doc|docx|xls|xlsx|sql|zip|rar)$/.test(item.name)
      }
    });

    // 删除上传脚本
    $scope.delUploadScrpit = function() {
      $scope.upload.uploadScrpit.status = 0;
      $scope.upload.uploadScrpit.progress = 0;
      $scope.upload.uploadScrpit.fileName = '';
      $scope.initDataTableData.scriptFileUid = '';
    };

    // 删除附件
    $scope.delAttachment = function() {
      $scope.upload.uploadAttachment.status = 0;
      $scope.upload.uploadAttachment.progress = 0;
      $scope.upload.uploadAttachment.fileName = '';
      $scope.initDataTableData.attachmentFileUid = '';
    };


    //备注信息的提示
    $(".comment").change(function() {
      var i = $(".comment").val().length;
      $(".textLength em").text(i);
      if(i >200){
        $(".textLength em").addClass("warning-red");
      }else{
        $(".textLength em").removeClass("warning-red");
      };
    });

    //  保存审核
    $scope.modifyTagSave = function() {
      $scope.submited = true;
      if ($scope.modifyTagForm.$valid) {
        var _tagData = {
          id: $scope.initDataTableData.id,
          dataCategory: $scope.initDataTableData.dataCategory,
          metaDbId: $scope.initDataTableData.metaDbId,
          metaTableId: $scope.initDataTableData.metaTableId,
          dataSource: $scope.initDataTableData.dataSource,
          refreshCycle: $scope.initDataTableData.refreshCycle,
          scriptFileUid: $scope.initDataTableData.scriptFileUid,
          attachmentFileUid: $scope.initDataTableData.attachmentFileUid,
          comment: $scope.initDataTableData.comment,
          modifyComment: $scope.initDataTableData.modifyComment,
          autoSubmitAudit: true,
          targetId: $scope.initDataTableData.targetId
        };

        dataService.postData('createOrModifyLabelGroup', _tagData).success(function(rs) {
          if (rs.status === 200) {
            toaster.clear();
            toaster.pop({
              type: 'success',
              title: '',
              body: rs.msg,
              timeout: 1000,
              onHideCallback: function() {
                $state.go('g.data.tagconfig');
              }
            });
          }
        });
      }
    };
    $scope.modifyTagSaveNoRun = function() {
      $scope.submited = true;
      if ($scope.modifyTagForm.$valid) {
        var _tagData = {
          id: $scope.initDataTableData.id,
          dataCategory: $scope.initDataTableData.dataCategory,
          metaDbId: $scope.initDataTableData.metaDbId,
          metaTableId: $scope.initDataTableData.metaTableId,
          dataSource: $scope.initDataTableData.dataSource,
          refreshCycle: $scope.initDataTableData.refreshCycle,
          scriptFileUid: $scope.initDataTableData.scriptFileUid,
          attachmentFileUid: $scope.initDataTableData.attachmentFileUid,
          comment: $scope.initDataTableData.comment,
          modifyComment: $scope.initDataTableData.modifyComment,
          autoSubmitAudit: true,
          targetId: $scope.initDataTableData.targetId
        };

        dataService.postData('createOrModifyLabelGroup', _tagData).success(function(rs) {
          if (rs.status === 200) {
            toaster.clear();
            toaster.pop({
              type: 'success',
              title: '',
              body: rs.msg,
              timeout: 1000,
            });
          }
        });
      }
    };
    //取消按钮
    $scope.cancel = function (){
      $(".mask").show();
    };
    $scope.next = function (){
      $(".mask").hide();
    };

  }
]);
