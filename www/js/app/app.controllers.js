angular.module('faceshop.app.controllers', [])

.controller('AppCtrl', function($scope, AuthService) {

    //this will represent our logged user
    var user = {
        about: "Design Lead of Project Fi. Love adventures, green tea, and the color pink.",
        name: "Brynn Evans",
        picture: "https://s3.amazonaws.com/uifaces/faces/twitter/brynn/128.jpg",
        _id: 0,
        followers: 345,
        following: 58
    };

    //save our logged user on the localStorage
    AuthService.saveUser(user);
    $scope.loggedUser = user;
})


.controller('ProfileCtrl', function($scope, $stateParams, PostService, $ionicHistory, $state, $ionicScrollDelegate) {

    $scope.$on('$ionicView.afterEnter', function() {
        $ionicScrollDelegate.$getByHandle('profile-scroll').resize();
    });

    var userId = $stateParams.userId;

    $scope.myProfile = $scope.loggedUser._id == userId;
    $scope.posts = [];
    $scope.likes = [];
    $scope.user = {};

    PostService.getUserPosts(userId).then(function(data) {
        $scope.posts = data;
    });

    PostService.getUserDetails(userId).then(function(data) {
        $scope.user = data;
    });

    PostService.getUserLikes(userId).then(function(data) {
        $scope.likes = data;
    });

    $scope.getUserLikes = function(userId) {
        //we need to do this in order to prevent the back to change
        $ionicHistory.currentView($ionicHistory.backView());
        $ionicHistory.nextViewOptions({ disableAnimate: true });

        $state.go('app.profile.likes', { userId: userId });
    };

    $scope.getUserPosts = function(userId) {
        //we need to do this in order to prevent the back to change
        $ionicHistory.currentView($ionicHistory.backView());
        $ionicHistory.nextViewOptions({ disableAnimate: true });

        $state.go('app.profile.posts', { userId: userId });
    };

})


.controller('ProductCtrl', function($scope, $stateParams, ShopService, $ionicPopup, $ionicLoading) {
    var productId = $stateParams.productId;

    ShopService.getProduct(productId).then(function(product) {
        $scope.product = product;
    });

    // show add to cart popup on button click
    $scope.showAddToCartPopup = function(product) {
        $scope.data = {};
        $scope.data.product = product;
        $scope.data.productOption = 1;
        $scope.data.productQuantity = 1;

        var myPopup = $ionicPopup.show({
            cssClass: 'add-to-cart-popup',
            templateUrl: 'views/app/shop/partials/add-to-cart-popup.html',
            title: 'Add to Cart',
            scope: $scope,
            buttons: [
                { text: '', type: 'close-popup ion-ios-close-outline' }, {
                    text: 'Add to cart',
                    onTap: function(e) {
                        return $scope.data;
                    }
                }
            ]
        });
        myPopup.then(function(res) {
            if (res) {
                $ionicLoading.show({ template: '<ion-spinner icon="ios"></ion-spinner><p style="margin: 5px 0 0 0;">Adding to cart</p>', duration: 1000 });
                ShopService.addProductToCart(res.product);
                console.log('Item added to cart!', res);
            } else {
                console.log('Popup closed');
            }
        });
    };
})


.controller('FeedCtrl', function($scope, PostService, OpenFB, $stateParams,$state) {
    $scope.posts = [];
    $scope.page = 1;
    $scope.totalPages = 1;
    var pageData = $stateParams
    $scope.loadFeed = function() {
        var pageID = pageData.id;
        OpenFB.get('/' + pageID + '/posts?fields=full_picture,message,updated_time,from,picture', { limit: 20 })
            .success(function(result) {
                $scope.items = result.data;;

                // Used with pull-to-refresh
                $scope.$broadcast('scroll.refreshComplete');
            })
            .error(function(data) {
                $scope.hide();
                alert(data.error.message);
            });
    }

    $scope.doRefresh = function() {
        PostService.getFeed(1)
            .then(function(data) {
                $scope.totalPages = data.totalPages;
                $scope.posts = data.posts;

                $scope.$broadcast('scroll.refreshComplete');
            });
    };

    $scope.getNewData = function() {
        //do something to load your new data here
        $scope.$broadcast('scroll.refreshComplete');
    };

    $scope.loadMoreData = function() {
        $scope.page += 1;

        PostService.getFeed($scope.page)
            .then(function(data) {
                //We will update this value in every request because new posts can be created
                $scope.totalPages = data.totalPages;
                $scope.posts = $scope.posts.concat(data.posts);

                $scope.$broadcast('scroll.infiniteScrollComplete');
            });
    };

    $scope.moreDataCanBeLoaded = function() {
        return $scope.totalPages > $scope.page;
    };

    $scope.doRefresh();

    $scope.gotoPost = function(){
        $state.go('post', {

                access_token: pageData.access_token,
                category: pageData.category,
                id: pageData.id,
                name: pageData.name,
                shopname: pageData.shopname,

            });
    }

})


.controller('ShopCtrl', function($scope, ShopService) {
    $scope.products = [];
    $scope.popular_products = [];

    ShopService.getProducts().then(function(products) {
        $scope.products = products;
    });



    ShopService.getProducts().then(function(products) {
        $scope.popular_products = products.slice(0, 2);
    });
})


.controller('ShoppingCartCtrl', function($scope, ShopService, $ionicActionSheet, _) {
    $scope.products = ShopService.getCartProducts();

    $scope.removeProductFromCart = function(product) {
        $ionicActionSheet.show({
            destructiveText: 'Remove from cart',
            cancelText: 'Cancel',
            cancel: function() {
                return true;
            },
            destructiveButtonClicked: function() {
                ShopService.removeProductFromCart(product);
                $scope.products = ShopService.getCartProducts();
                return true;
            }
        });
    };

    $scope.getSubtotal = function() {
        return _.reduce($scope.products, function(memo, product) {
            return memo + product.price;
        }, 0);
    };

})


.controller('CheckoutCtrl', function($scope) {
    //$scope.paymentDetails;
})

.controller('SettingsCtrl', function($scope, $ionicModal, $state, OpenFB) {

    $scope.signOut = function() {

        OpenFB.revokePermissions().then(
            function() {
                $state.go('facebook-sign-in');
            },
            function() {
                alert('OpenFB : Revoke Permissions Failed!ppppp');
            });

    }
    $scope.selectPages = function() {

        $state.go('facebook-select-page');
    }

    $ionicModal.fromTemplateUrl('views/app/legal/terms-of-service.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.terms_of_service_modal = modal;
    });

    $ionicModal.fromTemplateUrl('views/app/legal/privacy-policy.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.privacy_policy_modal = modal;
    });

    $scope.showTerms = function() {
        $scope.terms_of_service_modal.show();
    };

    $scope.showPrivacyPolicy = function() {
        $scope.privacy_policy_modal.show();
    };

})

.controller('CreateShopCtrl', function($scope, $stateParams, $state) {
        var page = $stateParams;

        $scope.shopInit = function() {
            $scope.page = page;
        }

        $scope.gotoselectnameshop = function(page) {

            $state.go('create-shop-name', {
                access_token: page.access_token,
                category: page.category,
                id: page.id,
                name: page.name,

            });
        };

        $scope.imagesshop = ['shop1', 'shop2', 'shop3', 'shop4'];

        $scope.selectImage = function(image) {
            if ($scope.selected_image === image) {
                $scope.selected_image = '';
            } else {
                $scope.selected_image = image;
            }
        }

        $scope.gotoFeed = function(page, shopname) {
            $state.go('feed', {

                access_token: page.access_token,
                category: page.category,
                id: page.id,
                name: page.name,
                shopname: shopname,

            });
        };
    })
    .controller('PostCtrl', function($scope, $stateParams, $state,OpenFB) {
        $scope.item = {};
        $scope.pages = $stateParams;
        $scope.post = function() {

            OpenFB.post('/me/feed', $scope.item, $scope.pages.access_token)
                .success(function() {
                    $scope.status = "OpenFB : Item Shared Successfully!";
                })
                .error(function(data) {
                    alert(data.error.message);
                });
        };
    });
