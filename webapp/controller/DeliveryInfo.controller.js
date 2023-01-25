sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    'sap/ui/model/Sorter',
    "sap/ui/Device",
    "sap/ui/table/library",
    "sap/m/TablePersoController",
    'sap/m/MessageToast',
	'sap/m/SearchField'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, JSONModel, MessageBox, Filter, FilterOperator, Sorter, Device, library, TablePersoController, MessageToast, SearchField) {
        "use strict";

        var _this;
        var _oCaption = {};

        return BaseController.extend("zuiodfty.controller.Reservation", {
            onInit: function () {
                _this = this;

                _this.getCaption();

                var oComponent = this.getOwnerComponent();
                this._router = oComponent.getRouter();
                this._router.getRoute("RouteDeliveryInfo").attachPatternMatched(this._routePatternMatched, this);
            },

            _routePatternMatched: function (oEvent) {
                this.getView().setModel(new JSONModel({
                    sbu: oEvent.getParameter("arguments").sbu,
                    dlvNo: oEvent.getParameter("arguments").dlvNo,
                    plant: oEvent.getParameter("arguments").plant
                }), "ui");

                _this.initializeComponent();
            },

            initializeComponent() {
                this.onInitBase(_this, _this.getView().getModel("ui").getData().sbu);
                _this.showLoadingDialog("Loading...");

                var aTableList = [];
                aTableList.push({
                    modCode: "ODFTYINFOHUMOD",
                    tblSrc: "ZDV_ODF_INF_HU",
                    tblId: "huTab",
                    tblModel: "hu"
                });

                aTableList.push({
                    modCode: "ODFTYINFODTLMOD",
                    tblSrc: "ZDV_ODF_INF_DTL",
                    tblId: "dtlTab",
                    tblModel: "dtl"
                });

                aTableList.push({
                    modCode: "ODFTYINFOSHIPMOD",
                    tblSrc: "ZDV_ODF_INF_SHIP",
                    tblId: "shipTab",
                    tblModel: "ship"
                });

                aTableList.push({
                    modCode: "ODFTYINFOSTATMOD",
                    tblSrc: "ZDV_ODF_INF_STAT",
                    tblId: "statTab",
                    tblModel: "stat"
                });

                aTableList.push({
                    modCode: "ODFTYINFOMDMOD",
                    tblSrc: "ZDV_ODF_INF_MD",
                    tblId: "matDocTab",
                    tblModel: "matDoc"
                });

                _this.getColumns(aTableList);

                // this._tableRendered = "";
                // var oTableEventDelegate = {
                //     onkeyup: function(oEvent){
                //         _this.onKeyUp(oEvent);
                //     },

                //     onAfterRendering: function(oEvent) {
                //         _this.onAfterTableRendering(oEvent);
                //     }
                // };

                // this.byId("rsvTab").addEventDelegate(oTableEventDelegate);

                _this.closeLoadingDialog();
            },

            onAfterTableRender(pTableId, pTableProps) {
                // if (pTableId == "rsvTab") {
                //     _this.getRsv();
                // }
            },

            onKeyUp(oEvent) {
                if ((oEvent.key === "ArrowUp" || oEvent.key === "ArrowDown") && oEvent.srcControl.sParentAggregationName === "rows") {
                    var oTable = this.byId(oEvent.srcControl.sId).oParent;

                    // if (this.byId(oEvent.srcControl.sId).getBindingContext("rsv")) {
                    //     var sRowPath = this.byId(oEvent.srcControl.sId).getBindingContext("rsv").sPath;
                        
                    //     oTable.getModel("rsv").getData().results.forEach(row => row.ACTIVE = "");
                    //     oTable.getModel("rsv").setProperty(sRowPath + "/ACTIVE", "X"); 
                        
                    //     oTable.getRows().forEach(row => {
                    //         if (row.getBindingContext("rsv") && row.getBindingContext("rsv").sPath.replace("/results/", "") === sRowPath.replace("/results/", "")) {
                    //             row.addStyleClass("activeRow");
                    //         }
                    //         else row.removeStyleClass("activeRow")
                    //     })
                    // }
                }
            },

            getCaption() {
                var oJSONModel = new JSONModel();
                var oCaptionParam = [];
                var oCaptionResult = {};
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");

                // Form
                oCaptionParam.push({CODE: "DLVNO"});
                oCaptionParam.push({CODE: "MVTTYPE"});
                oCaptionParam.push({CODE: "STATUS"});
                oCaptionParam.push({CODE: "DOCDT"});
                oCaptionParam.push({CODE: "REQDT"});

                oCaptionParam.push({CODE: "WAREHOUSE"});
                oCaptionParam.push({CODE: "ISSPLANT"});
                oCaptionParam.push({CODE: "ISSSLOC"});
                oCaptionParam.push({CODE: "RCVPLANT"});
                oCaptionParam.push({CODE: "RCVSLOC"});

                oCaptionParam.push({CODE: "POSTDT"});
                oCaptionParam.push({CODE: "ACTISSDT"});
                oCaptionParam.push({CODE: "REFDOCNO"});
                oCaptionParam.push({CODE: "REFDOCDT"});
                oCaptionParam.push({CODE: "HDRTEXT"});

                oCaptionParam.push({CODE: "DELETED"});
                oCaptionParam.push({CODE: "CREATEDBY"});
                oCaptionParam.push({CODE: "CREATEDDT"});
                oCaptionParam.push({CODE: "UPDATEDBY"});
                oCaptionParam.push({CODE: "UPDATEDDT"});

                // MessageBox
                oCaptionParam.push({CODE: "INFO_NO_RECORD_SELECT"});
                oCaptionParam.push({CODE: "CONFIRM_PROCEED_CLOSE"});
                
                oModel.create("/CaptionMsgSet", { CaptionMsgItems: oCaptionParam  }, {
                    method: "POST",
                    success: function(oData, oResponse) {
                        oData.CaptionMsgItems.results.forEach(item => {
                            oCaptionResult[item.CODE] = item.TEXT;
                        })

                        oJSONModel.setData(oCaptionResult);
                        _this.getView().setModel(oJSONModel, "caption");

                        _oCaption = _this.getView().getModel("caption").getData();
                    },
                    error: function(err) {
                        MessageBox.error(err);
                        _this.closeLoadingDialog();
                    }
                });
            }
        });
    });