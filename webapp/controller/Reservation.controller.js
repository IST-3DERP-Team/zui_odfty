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
                this._router.getRoute("RouteReservation").attachPatternMatched(this._routePatternMatched, this);
            },

            _routePatternMatched: function (oEvent) {
                this.getView().setModel(new JSONModel({
                    sbu: oEvent.getParameter("arguments").sbu,
                    dlvType: oEvent.getParameter("arguments").dlvType,
                    mvtType: oEvent.getParameter("arguments").mvtType,
                    srcTbl: oEvent.getParameter("arguments").srcTbl
                }), "ui");

                _this.initializeComponent();
            },

            initializeComponent() {
                this.onInitBase(_this, _this.getView().getModel("ui").getData().sbu);
                _this.showLoadingDialog("Loading...");

                var aTableList = [];
                aTableList.push({
                    modCode: "ODFTYRSVMOD",
                    tblSrc: "ZDV_ODF_RSV",
                    tblId: "rsvTab",
                    tblModel: "rsv"
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

                this.byId("rsvTab").addEventDelegate(oTableEventDelegate);

                _this.closeLoadingDialog();
            },

            onAfterTableRender(pTableId, pTableProps) {
                if (pTableId == "rsvTab") {
                    _this.getRsv();
                }
            },

            getRsv() {
                _this.showLoadingDialog("Loading...");

                var oTable = _this.getView().byId("rsvTab");
                var oModel = _this.getOwnerComponent().getModel();
                var sMvtType = _this.getView().getModel("ui").getData().mvtType;
                var sSrcTbl = _this.getView().getModel("ui").getData().srcTbl;
                
                var sFilter = "MVTTYPE eq '" + sMvtType + "' and SRCTBL eq '" + sSrcTbl + "'";
                oModel.read('/ReservationSet', {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("ReservationSet", data)

                        data.results.forEach(item => {
                            item.REQDT = _this.formatDate(item.REQDT);
                        })

                        var aFilterTab = [];
                        if (oTable.getBinding("rows")) {
                            aFilterTab = oTable.getBinding("rows").aFilters;
                        }

                        var oJSONModel = new JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "rsv");
                        _this._tableRendered = "rsvTab";

                        _this.onFilterByCol("rsv", aFilterTab);

                        _this.setRowReadMode("rsv");

                        oTable.getColumns().forEach((col, idx) => {   
                            if (col._oSorter) {
                                oTable.sort(col, col.mProperties.sortOrder === "Ascending" ? SortOrder.Ascending : SortOrder.Descending, true);
                            }
                        });
                        
                        _this.closeLoadingDialog();
                    },
                    error: function (err) { 
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                })
            },

            onAdd() {
                _this._router.navTo("RouteDeliveryInfo", {
                    sbu: _this.getView().getModel("ui").getData().sbu,
                    dlvNo: "empty",
                    plant: "empty"
                });
            },

            onCancel() {
                MessageBox.confirm(_oCaption.CONFIRM_PROCEED_CLOSE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction == "Yes") {
                            _this._router.navTo("RouteMain", {}, true);
                        }
                    }
                });
            },

            onKeyUp(oEvent) {
                if ((oEvent.key === "ArrowUp" || oEvent.key === "ArrowDown") && oEvent.srcControl.sParentAggregationName === "rows") {
                    var oTable = this.byId(oEvent.srcControl.sId).oParent;

                    if (this.byId(oEvent.srcControl.sId).getBindingContext("rsv")) {
                        var sRowPath = this.byId(oEvent.srcControl.sId).getBindingContext("rsv").sPath;
                        
                        oTable.getModel("rsv").getData().results.forEach(row => row.ACTIVE = "");
                        oTable.getModel("rsv").setProperty(sRowPath + "/ACTIVE", "X"); 
                        
                        oTable.getRows().forEach(row => {
                            if (row.getBindingContext("rsv") && row.getBindingContext("rsv").sPath.replace("/results/", "") === sRowPath.replace("/results/", "")) {
                                row.addStyleClass("activeRow");
                            }
                            else row.removeStyleClass("activeRow")
                        })
                    }
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