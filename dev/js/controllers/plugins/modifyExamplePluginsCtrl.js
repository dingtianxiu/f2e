/*
 * 修改实例
 */
app.controller('modifyExamplePluginsCtrl', ['$scope', '$stateParams', '$state', '$cookies', 'globalConfig', 'dataService', 'FileUploader', 'toaster', '$timeout',
	function($scope, $stateParams, $state, $cookies, globalConfig, dataService, FileUploader, toaster, $timeout) {
		var _id = $stateParams.id;
		$scope.submited = false;

		$scope.step = 1;
	    //字符过长提示
	    $scope.maxLength = true;

		$scope.initDataTableData = {};
		$scope.initWidgetName = '';
		// 上传状态等
		$scope.upload = {
			uploadAttachment: {
				status: 0,
				progress: 0,
				fileName: ''
			}
		};
		$scope.dataTableListData = {
			widgetList: []
		};
		$scope.initTempData = {
			thumbnail: '',
			previewChartUrl: '/chartPreview.html',
			checkChart: '?',
			checkExpName: '' //储存初始实例名
		};

		// $(".bq_wrap").css("height",$(window).height()-79);
    	$(".shadow-div").css({"height":($(window).height()-379)/2,"overflow-y":"auto"});
    	$(".preview-box").css("height",$(window).height()-316);


		//监控输入字符
	    $scope.$watch('initDataTableData.comment', function (newValue) {
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

		// 更新提交预览的状态
		$scope.updateValid = function(val) {
				$scope.initTempData.checkChart = val;
				$scope.$apply();
			}
		$scope.$watch('initTempData.checkChart', function(data) {
			if(false==data){
				toaster.pop({
					type: 'error',
					title: '',
					body: '预览失败',
					showCloseButton: false
				});
			}
		});
			//根据id获取实例详情
		function getExampleDetail() {
			dataService.getData('getWidget', {
				id: _id
			}).success(function(rs) {
				$scope.initDataTableData = rs.data;
				$scope.initTempData.checkExpName = rs.data.name;
				$scope.initTempData.thumbnail = globalConfig.api.getres + '/' + rs.data.thumbnailFileUid + '?ticket=' + $cookies.get('auth');
				dataService.getData('getWidgetForEdit', {
					id: rs.data.widgetId
				}).success(function(ret) {
					$scope.initDataTableData.pluginFileUid = ret.data.pluginFileUid;
				});
				if (rs.data.thumbnailFileUid) {
					// 设置上传等信息
					$scope.upload.uploadAttachment.status = 2;
					$scope.upload.uploadAttachment.progress = 100;
					$scope.upload.uploadAttachment.fileName = rs.data.thumbnailFileName;
				}
				getWidgetList($scope.initDataTableData);
			});
		}
		getExampleDetail();
		$scope.widgetChange = function() {
				dataService.getData('getWidgetForEdit', {
					id: $scope.initDataTableData.widgetId
				}).success(function(ret) {
					$scope.initDataTableData.pluginFileUid = ret.data.pluginFileUid;
				});
			}
			// 上传附件
		var uploaderAttachment = $scope.uploaderAttachment = new FileUploader({
			url: globalConfig.api.uploadFile + '?type=widget_thumbnail',
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
						body: '文件格式应为jpg,png,gif中的一种',
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
					$scope.initDataTableData.thumbnailFileUid = response.data.uid;
					$scope.initTempData.thumbnail = globalConfig.api.getres + '/' + response.data.uid + '?ticket=' + $cookies.get('auth');
					$('#uploaderAttachmentid').val('');
				} else if (status === 200 && response.status === 503) {
					$scope.upload.uploadAttachment.status = 0; // 上传失败
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
				return /^.*?\.(jpg|png|gif)$/.test(item.name)
			}
		});

		// 删除附件
		$scope.delAttachment = function() {
			$scope.upload.uploadAttachment.status = 0;
			$scope.upload.uploadAttachment.progress = 0;
			$scope.upload.uploadAttachment.fileName = '';
			$scope.initDataTableData.thumbnailFileUid = '';
		}

		// 获取控件名称列表
		function getWidgetList(initDataTableData) {
			dataService.getData('widgetSimpleList', '').success(function(rs) {
				$scope.dataTableListData.widgetList = rs.data;
			});
		}
		$scope.aClick1 = false;
		$scope.aClick2 = true;
		//参数配置按钮
		$scope.firstStep = function() {
			$scope.step = 2;
				dataService.getData('verityByName', {
					name: $scope.initDataTableData.name
				}).success(function(rs) {
					$scope.initDataTableData.isHave = rs.data;
					//当修改的实例名和原有实例名不同 进行重名判断
					if (!($scope.initDataTableData.name == $scope.initTempData.checkExpName)) {
						if ($scope.initDataTableData.isHave == false) {
							toaster.pop({
								type: 'error',
								title: '',
								body: '实例名已存在',
								showCloseButton: false
							});
							return false;
						}

					}
					//必填项
					if (!$scope.initDataTableData.name || !$scope.initDataTableData.thumbnailFileUid || !$scope.initDataTableData.comment) {
						toaster.pop({
							type: 'error',
							title: '',
							body: '有必填项未填写完成，请填写',							showCloseButton: false
						});
						return false;
					}

					// 长度验证
					if ($scope.initDataTableData.name.length > 20) {
						toaster.pop({
							type: 'error',
							title: '',
							body: '实例名称长度超过20个字',
							showCloseButton: false
						});
						return false;
					}
					if ($scope.initDataTableData.comment.length > 200) {
						toaster.pop({
							type: 'error',
							title: '',
							body: '实例说明长度超过200个字',
							showCloseButton: false
						});
						return false;
					}

					$('.step1').hide();
					$('.step2').show();
					$('.step3').hide();

					$timeout(function() {
						$scope.initDataTableData.ticket = $cookies.get('auth');
						$('.CodeMirror').each(function(i, el) {
							el.CodeMirror.refresh();
							if (i == 0) {
								$scope.initDataTableData.sampleStyle = el.CodeMirror.getValue();
							}
							if (i == 1) {
								$scope.initDataTableData.sampleData = el.CodeMirror.getValue();
							}
						});

						document.getElementById('previewIfrom').contentWindow.updatedata($scope.initDataTableData);

					}, 1000);
				});
			}
			//提交审核按钮
		$scope.secondStep = function() {
			$scope.step = 3;
				if (!$scope.initDataTableData.sampleData || !$scope.initDataTableData.sampleStyle) {
					toaster.pop({
						type: 'error',
						title: '',
						body: '有必填项未填写完成，请填写。',
						showCloseButton: false
					});
					return false;
				};
				if ($scope.initTempData.checkChart!=true) {
					toaster.pop({
						type: 'error',
						title: '',
						body: '自动预览不成功，不能进行提交审核！',
						showCloseButton: false
					});
					return false;
				}

				$('.step1').hide();
				$('.step2').hide();
				$scope.submited = true;
				if ($scope.modExampleform.$valid) {
					var _tagData = {
						id: $scope.initDataTableData.id,
						name: $scope.initDataTableData.name,
						widgetId: $scope.initDataTableData.widgetId,
						thumbnailFileUid: $scope.initDataTableData.thumbnailFileUid,
						sampleData: $scope.initDataTableData.sampleData,
						sampleStyle: $scope.initDataTableData.sampleStyle,
						comment: $scope.initDataTableData.comment,
						autoSubmitAudit: true,
					};
					dataService.postData('modifyWidget', _tagData).success(function(rs) {
						if (rs.status === 200) {
							toaster.clear();
							$('.step3').show();
						}
					});
				}
			}
			//预览图按钮
		$scope.previewClick = function() {
				$('#preview').show();
				$('#thumbnail').hide();
				$scope.aClick1 = false;
				$scope.aClick2 = true
			}
			//缩略图按钮
		$scope.thumbnailClick = function() {
				$('#preview').hide();
				$('#thumbnail').show();
				$scope.aClick1 = true;
				$scope.aClick2 = false
			}
			//返回基础信息页面
		$scope.backSecStep = function() {
			$scope.step = 1;
			$('.step1').show();
			$('.step2').hide();
			$('.step3').hide();

		}
		$scope.backExampleList = function() {
			$state.go('g.plugins.exampleList')
		}

		//重置
		$scope.resetCode = function() {
				getExampleDetail();
				var iframe = document.getElementById('previewIfrom');
				iframe.contentWindow.location.reload();
				$timeout(function() {
					$scope.initDataTableData.ticket = $cookies.get('auth');
					$('.CodeMirror').each(function(i, el) {
						el.CodeMirror.refresh();
						if (i == 0) {
							$scope.initDataTableData.sampleStyle = el.CodeMirror.getValue();
						}
						if (i == 1) {
							$scope.initDataTableData.sampleData = el.CodeMirror.getValue();
						}
					});
					document.getElementById('previewIfrom').contentWindow.updatedata($scope.initDataTableData);
				}, 1000);
			}
			//运行
		$scope.previewExamp = function() {
			var iframe = document.getElementById('previewIfrom');
			iframe.contentWindow.location.reload();
			$timeout(function() {
				$scope.initDataTableData.ticket = $cookies.get('auth');
				$('.CodeMirror').each(function(i, el) {
					el.CodeMirror.refresh();
					if (i == 0) {
						$scope.initDataTableData.sampleStyle = el.CodeMirror.getValue();
					}
					if (i == 1) {
						$scope.initDataTableData.sampleData = el.CodeMirror.getValue();
					}
				});
				document.getElementById('previewIfrom').contentWindow.updatedata($scope.initDataTableData);
			}, 1000);
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