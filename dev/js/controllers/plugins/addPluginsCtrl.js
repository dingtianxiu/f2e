/**
 * 新建控件
 */
app.controller('addPluginsCtrl', ['$scope', '$cookies', '$timeout', 'globalConfig', 'dataService', 'FileUploader', 'toaster',
	function($scope, $cookies, $timeout, globalConfig, dataService, FileUploader, toaster) {

		$scope.submited = false;

		//字符过长提示
    	$scope.maxLength = true;
    	
		// 页面配置
		$scope.pageData = {
			step: 1, // 步骤状态
			previewChartUrl: '/chartPreview.html',
			checkChart: '?',
			categoryList: [],
			baseLibList: []
		}

		// 表单数据
		$scope.formData = {
			name: '',
			category: null,
			baseLibs: null,
			pluginFileUid: null,
			styleFileUid: null,
			docFileUid: null,
			widgetSampleName: '',
			thumbnailFileUid: null,
			sampleStyle: '',
			sampleData: '',
			comment: ''
		}

		// 临时显示数据
		$scope.tempShowData = {
			thumbnail: null,
			previewTabIndex: 0
		}

		// 设置高度
    	$(".bq_wrap").css("height",$(window).height());
    	$(".shadow-div").css({"height":($(window).height()-379)/2,"overflow-y":"auto"});
    	$("#previewIfrom").css("height",$(window).height()-339);
		$("#chartPreview").css({"height":$(window).height()-319,"overflow-y":"auto","width":$(".step-right").width()});
		// 获取控件分类|底层库
		function getPluginCate() {
			// 获取控件分类
			dataService.getData('queryByParentId', {
				parentId: 193
			}).success(function(rs) {
				$scope.pageData.categoryList = rs.data;
				$scope.formData.category = rs.data[0]['id'] || '';
			});
			// 底层库
			dataService.getData('queryByParentId', {
				parentId: 188
			}).success(function(rs) {
				$scope.pageData.baseLibList = rs.data;
			});
		}
		getPluginCate();

		// 更新提交预览的状态
		$scope.updateValid = function(val) {
			$scope.pageData.checkChart = val;
			$scope.$apply();
		}
		$scope.$watch('pageData.checkChart', function(data) {
			if(false==data){
				toaster.pop({
					type: 'error',
					title: '发生错误',
					body: '预览失败',
					showCloseButton: false
				});
			}
		});

		// 配置编辑器
		$scope.editorOptions = {
			lineWrapping: true,
			lineNumbers: true,
			lang: "js",
			// readOnly: 'nocursor',
			mode: {
				name: "javascript",
				json: true
			}
		};

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

		// 上传状态等
		$scope.upload = {
			uploadScrpit: {
				status: 0, // 上传前，上传失败 0， 上传中 1， 上传成功 2
				progress: 0,
				fileName: ''
			},
			uploadAttachment: {
				status: 0,
				progress: 0,
				fileName: ''
			},
			uploadDoc: {
				status: 0,
				progress: 0,
				fileName: ''
			},
			uploadThumbnail: {
				status: 0,
				progress: 0,
				fileName: ''
			}
		};

		//监控输入字符
	    $scope.$watch('formData.comment', function (newValue) {
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

		// 上传扩展插件
		var uploaderScript = $scope.uploaderScript = new FileUploader({
			url: globalConfig.api.uploadFile + '?type=widget_plugin',
			autoUpload: true,
			queueLimit: 1,
			headers: {
				ticket: $cookies.get('auth')
			},
			removeAfterUpload: true,
			onWhenAddingFileFailed: function(item, filter, options) { // 上传前失败
				toaster.clear();
				if(filter.name == 'enforceMaxFileSize') {
					toaster.pop({
						type: 'error',
						title: '',
						body: '上传文件大小超过20M',
						showCloseButton: false
					});
				}

				if(filter.name == 'scriptfileType') {
					toaster.pop({
						type: 'error',
						title: '',
						body: '文件格式应为js中的一种',
						showCloseButton: false
					});
				}
				$('#uploaderScriptid').val('');
			},
			onProgressItem: function(item, progress) {
				$scope.upload.uploadScrpit.status = 1;
			},
			onSuccessItem: function(item, response, status, headers) { // 上传成功
				if(status === 200 && response.status === 200) {
					$scope.upload.uploadScrpit.status = 2; // 上传完成
					$scope.upload.uploadScrpit.fileName = response.data.name; // 文件名
					$scope.formData.pluginFileUid = response.data.uid;
					$('#uploaderScriptid').val('');
				} else if(status === 200 && response.status === 503) {
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
				return /^.*?\.(js)$/.test(item.name)
			}
		});
		// 删除扩展插件
		$scope.delUploadScrpit = function() {
			$scope.upload.uploadScrpit.status = 0;
			$scope.upload.uploadScrpit.progress = 0;
			$scope.upload.uploadScrpit.fileName = '';
			$scope.formData.pluginFileUid = '';
		}

		// 上传附加样式
		var uploaderAttachment = $scope.uploaderAttachment = new FileUploader({
			url: globalConfig.api.uploadFile + '?type=widget_style',
			autoUpload: true,
			queueLimit: 1,
			headers: {
				ticket: $cookies.get('auth')
			},
			removeAfterUpload: true,
			onWhenAddingFileFailed: function(item, filter, options) { // 上传前失败
				toaster.clear();
				if(filter.name == 'enforceMaxFileSize') {
					toaster.pop({
						type: 'error',
						title: '',
						body: '上传文件大小超过20M',
						showCloseButton: false
					});
				}

				if(filter.name == 'scriptfileType') {
					toaster.pop({
						type: 'error',
						title: '',
						body: '文件格式应为css,less,sass中的一种',
						showCloseButton: false
					});
				}
				$('#uploaderAttachmentid').val('');
			},
			onProgressItem: function(item, progress) {
				$scope.upload.uploadAttachment.status = 1;
			},
			onSuccessItem: function(item, response, status, headers) { // 上传成功
				if(status === 200 && response.status === 200) {
					$scope.upload.uploadAttachment.status = 2; // 上传完成
					$scope.upload.uploadAttachment.fileName = response.data.name; // 文件名
					$scope.formData.styleFileUid = response.data.uid;
					$('#uploaderAttachmentid').val('');
				} else if(status === 200 && response.status === 503) {
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
				return /^.*?\.(css|less|sass)$/.test(item.name)
			}
		});
		// 删除附加样式
		$scope.delUploadAttachment = function() {
			$scope.upload.uploadAttachment.status = 0;
			$scope.upload.uploadAttachment.progress = 0;
			$scope.upload.uploadAttachment.fileName = '';
			$scope.formData.styleFileUid = '';
		}

		// 上传开发文档
		var uploaderDoc = $scope.uploaderDoc = new FileUploader({
			url: globalConfig.api.uploadFile + '?type=widget_doc',
			autoUpload: true,
			queueLimit: 1,
			headers: {
				ticket: $cookies.get('auth')
			},
			removeAfterUpload: true,
			onWhenAddingFileFailed: function(item, filter, options) { // 上传前失败
				toaster.clear();
				if(filter.name == 'enforceMaxFileSize') {
					toaster.pop({
						type: 'error',
						title: '',
						body: '上传文件大小超过20M',
						showCloseButton: false
					});
				}

				if(filter.name == 'scriptfileType') {
					toaster.pop({
						type: 'error',
						title: '',
						body: '文件格式应为html、doc、docx、md中的一种',
						showCloseButton: false
					});
				}
				$('#uploaderDoc').val('');
			},
			onProgressItem: function(item, progress) {
				$scope.upload.uploadDoc.status = 1;
			},
			onSuccessItem: function(item, response, status, headers) { // 上传成功
				if(status === 200 && response.status === 200) {
					$scope.upload.uploadDoc.status = 2; // 上传完成
					$scope.upload.uploadDoc.fileName = response.data.name; // 文件名
					$scope.formData.docFileUid = response.data.uid;
					$('#uploaderAttachmentid').val('');
				} else if(status === 200 && response.status === 503) {
					$scope.upload.uploadDoc.status = 0; // 上传失败
					toaster.clear();
					toaster.pop({
						type: 'error',
						title: '',
						body: response.msg,
						showCloseButton: false,
					});
					$('#uploaderDoc').val('');
				}
			}
		});
		uploaderDoc.filters.push({
			'name': 'enforceMaxFileSize',
			'fn': function(item) {
				return item.size <= 20971520; // 20 MiB to bytes
			}
		});
		uploaderDoc.filters.push({
			'name': 'scriptfileType',
			'fn': function(item) {
				return /^.*?\.(html|doc|docx|md)$/.test(item.name)
			}
		});
		// 删除文档
		$scope.delUploadDoc = function() {
			$scope.upload.uploadDoc.status = 0;
			$scope.upload.uploadDoc.progress = 0;
			$scope.upload.uploadDoc.fileName = '';
			$scope.formData.docFileUid = '';
		}

		// 上传缩略图
		var uploadThumbnail = $scope.uploadThumbnail = new FileUploader({
			url: globalConfig.api.uploadFile + '?type=widget_thumbnail',
			autoUpload: true,
			queueLimit: 1,
			headers: {
				ticket: $cookies.get('auth')
			},
			removeAfterUpload: true,
			onWhenAddingFileFailed: function(item, filter, options) { // 上传前失败
				toaster.clear();
				if(filter.name == 'enforceMaxFileSize') {
					toaster.pop({
						type: 'error',
						title: '',
						body: '上传文件大小超过20M',
						showCloseButton: false
					});
				}

				if(filter.name == 'scriptfileType') {
					toaster.pop({
						type: 'error',
						title: '',
						body: '文件格式应为jpg,png,gif中的一种',
						showCloseButton: false
					});
				}
				$('#uploadThumbnailId').val('');
			},
			onProgressItem: function(item, progress) {
				$scope.upload.uploadThumbnail.status = 1;
			},
			onSuccessItem: function(item, response, status, headers) { // 上传成功
				if(status === 200 && response.status === 200) {
					$scope.upload.uploadThumbnail.status = 2; // 上传完成
					$scope.upload.uploadThumbnail.fileName = response.data.name; // 文件名
					$scope.formData.thumbnailFileUid = response.data.uid;
					$('#uploaderThumbnail').val('');
					$scope.tempShowData.thumbnail = globalConfig.api.getres + '/' + response.data.uid + '?ticket=' + $cookies.get('auth');
				} else if(status === 200 && response.status === 503) {
					$scope.upload.uploadThumbnail.status = 0; // 上传完成
					toaster.clear();
					toaster.pop({
						type: 'error',
						title: '',
						body: response.msg,
						showCloseButton: false,
					});
					$('#uploadThumbnailId').val('');
				}
			}
		});
		uploadThumbnail.filters.push({
			'name': 'enforceMaxFileSize',
			'fn': function(item) {
				return item.size <= 20971520; // 20 MiB to bytes
			}
		});
		uploadThumbnail.filters.push({
			'name': 'scriptfileType',
			'fn': function(item) {
				return /^.*?\.(jpg|png|gif)$/.test(item.name)
			}
		});
		// 删除缩略图
		$scope.delUploadThumbnail = function() {
			$scope.upload.uploadThumbnail.status = 0;
			$scope.upload.uploadThumbnail.progress = 0;
			$scope.upload.uploadThumbnail.fileName = '';
			$scope.formData.thumbnailFileUid = '';
		}

		// 去第二步
		$scope.toStep2 = function() {
			$scope.submited = true;
			// 验证重名错误
			dataService.getData('verityByWidgetName', {
					id: null,
					name: $scope.formData.name
				})
				.success(function(rs) {
					if(rs.data == false) {
						toaster.pop({
							type: 'error',
							title: '',
							body: '控件名称已存在，不能创建相同名称的控件！',
							showCloseButton: false
						});
						return false;
					} else {
						// 必填项
						if(!$scope.formData.thumbnailFileUid ||!$scope.formData.name || !$scope.formData.category || !$scope.formData.baseLibs
							|| !$scope.formData.pluginFileUid || !$scope.formData.docFileUid||!$scope.formData.comment||$scope.formData.baseLibs=='') {
							toaster.pop({
								type: 'error',
								title: '',
								body: '有必填项未填写完成，请填写。',
								showCloseButton: false
							});
							return false;
						}
						if($scope.formData.comment.length > 200) {
							toaster.pop({
								type: 'error',
								title: '',
								body: '实例说明长度超过200个字',
								showCloseButton: false
							});
							return false;
						}
						// 必填项
						if($scope.formData.name.length > 20) {
							toaster.pop({
								type: 'error',
								title: '',
								body: '控件名称长度超过20个字',
								showCloseButton: false
							});
							return false;
						}
						$scope.pageData.step = 2;
					}
				});
		}

		// 去第三步
		$scope.toStep3 = function() {
			if(!$scope.formData.sampleData || !$scope.formData.sampleStyle) {
							toaster.pop({
								type: 'error',
								title: '',
								body: '有必填项未填写完成，请填写',								showCloseButton: false
							});
							return false;
						}
			if($scope.pageData.checkChart!=true) {
				toaster.pop({
					type: 'error',
					title: '',
					body: '自动预览不成功，不能进行提交审核！',
					showCloseButton: false
				});
				return false;
			}
               $scope.formData.widgetSampleName='标准'+$scope.formData.name;
			var temp = $scope.formData;
			temp.baseLibs = temp.baseLibs.join(',');
			// 保存数据
			dataService.postData('createmyWidget', temp).success(function(rs) {
				if(rs.status === 200) {
					$scope.pageData.step = 3;
				}

			});
			
			//    dataService.getData('verityByName', {
			//      name: $scope.formData.widgetSampleName
			//    }).success(function(rs) {
			//实例名验证
			//      if (rs.data == false) {
			//        toaster.pop({
			//          type: 'error',
			//          title: '',
			//          body: '实例名已存在',
			//          showCloseButton: false
			//        });
			//        return false;
			//      }
			// 验证错误
			// 必填项

			// 长度控制
			//      if ($scope.formData.widgetSampleName.length > 20) {
			//        toaster.pop({
			//          type: 'error',
			//          title: '',
			//          body: '实例名称长度超过20个字',
			//          showCloseButton: false
			//        });
			//        return false;
			//      }

			
			// $scope.pageData.previewChartUrl = '/chartPreview.html';

			

			//    });

		}
		$scope.previewExamp = function() {
			var iframe = document.getElementById('previewIfrom');
			iframe.contentWindow.location.reload();
			$timeout(function() {
				$scope.formData.ticket = $cookies.get('auth');
				$('.CodeMirror').each(function(i, el) {
					el.CodeMirror.refresh();
					if(i == 0) {
						$scope.formData.sampleStyle = el.CodeMirror.getValue();
					}
					if(i == 1) {
						$scope.formData.sampleData = el.CodeMirror.getValue();
					}
				});

				document.getElementById('previewIfrom').contentWindow.updatedata($scope.formData);

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