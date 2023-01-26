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
                this._router.getRoute("RoutePicking").attachPatternMatched(this._routePatternMatched, this);
            },

            _routePatternMatched: function (oEvent) {
                this.getView().setModel(new JSONModel({
                    sbu: oEvent.getParameter("arguments").sbu,
                    dlvNo: oEvent.getParameter("arguments").dlvNo
                }), "ui");

                _this.initializeComponent();
            },

            initializeComponent() {
                this.onInitBase(_this, _this.getView().getModel("ui").getData().sbu);
                _this.showLoadingDialog("Loading...");

                var aTableList = [];
                aTableList.push({
                    modCode: "ODFTYPICKHDRMOD",
                    tblSrc: "ZDV_ODF_PCK_HDR",
                    tblId: "pickHdrTab",
                    tblModel: "pickHdr"
                });

                aTableList.push({
                    modCode: "ODFTYPICKDTLMOD",
                    tblSrc: "ZDV_ODF_PCK_DTL",
                    tblId: "pickDtlTab",
                    tblModel: "pickDtl"
                });

                _this.getColumns(aTableList);

                this._tableRendered = "";
                var oTableEventDelegate = {
                    onkeyup: function(oEvent){
                        _this.onKeyUp(oEvent);
                    },

                    onAfterRendering: function(oEvent) {
                        _this.onAfterTableRendering(oEvent);
                    }
                };

                this.byId("pickHdrTab").addEventDelegate(oTableEventDelegate);
                this.byId("pickDtlTab").addEventDelegate(oTableEventDelegate);

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