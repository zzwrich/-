import React, { useState, useEffect } from 'react';
import "cesium/Build/Cesium/Widgets/widgets.css";
import './index.css';
import 'element-theme-default';
import Scrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { Button, Menu } from 'element-react';
import { Tabs } from 'antd';
import 'react-tabs/style/react-tabs.css';
import { getSatelliteDescription } from './info'
import Select from 'react-select';

const Cesium = require('cesium');
const { TabPane } = Tabs;

(window as any).CESIUM_BASE_URL = './assets/Cesium'
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxODA4ZjNkNC1mMmRjLTRhNjUtYmZjMi1mNmFkYjdmOTQ2MzgiLCJpZCI6MTMxOTMyLCJpYXQiOjE2ODA1MjUzMjZ9.Dxbhg-RQDDXQcwbTQOWHwbs475WvA24EW698H9BgVDc'

// 定义类组件
class CesiumViewer extends React.Component {
	viewer: any; // 声明 viewer 属性
	entities: any;//声明卫星实体
	state = {
		//筛选得到的实体ID
		filterId: [],
		//选择的czml文件
		czmlData: null,
		//是否展示菜单栏
		isShow: false,
		//选择展示的卫星类型
		showGPS: true,
		showSTARLINK: true,
		showBEIDOU: true,
		//存基站相连卫星ID
		shanghai: [],
		beijing: [],
		chongqing: [],
		los: [],
		seattle: [],
		//选中的基站
		selectedLoc: null,
		//选中的卫星
		selectedSat: null
	};

	// 初始化Cesium地图 挂载（组件第一次加载至dom元素时执行）
	componentDidMount() {
		this.viewer = new Cesium.Viewer('cesiumContainer');
		//存放实体名称信息
		const filterId: string[] = [];
		Cesium.CzmlDataSource.load('./data/star-beidou-gps-2.czml').then((dataSource: any) => {
			this.viewer.dataSources.add(dataSource);
			this.entities = dataSource.entities;

			for (let i = 0; i < this.entities.values.length; i++) {
				const entity = this.entities.values[i];
				const idArr = entity.id.split('/')
				if (idArr.length == 2 && idArr[0] == "Satellite") {
					//修改description内容
					if (entity.description?._value) {
						const noradId = idArr[1].split('_').at(-1)
						entity.description._value = getSatelliteDescription(noradId)
					}
					// const positions = entity.position?.getValue(Cesium.JulianDate.now());
					// console.log(positions)
					filterId.push(entity.id)
					//初始时全部显示
					if (entity.id.indexOf("GPS") !== -1) {
						entity.show = this.state.showGPS;
					}
					if (entity.id.indexOf("BEIDOU") !== -1) {
						entity.show = this.state.showBEIDOU
					}
					if (entity.id.indexOf("STARLINK") !== -1) {
						entity.show = this.state.showSTARLINK;
					}
				}
			}
			this.setState({
				filterId
			});
		}).otherwise((error: any) => {
			console.log(error);
		});
	}

	// 处理选择本地czml文件事件
	handleCzmlFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		console.log("files", files)
		if (files && files.length > 0) {
			const reader = new FileReader();
			reader.readAsText(files[0]);
			console.log(reader)
			reader.onload = () => {
				const czmlData = JSON.parse(reader.result);
				this.setState({ czmlData });
				console.log(czmlData)
				// 载入czml数据
				const dataSource = Cesium.CzmlDataSource.load(czmlData);
				console.log(typeof czmlData)
				console.log(dataSource)
				this.viewer.dataSources.removeAll();
				this.viewer.dataSources.add(dataSource);
			};
		}
	}
	// 切换导航菜单展开/收起状态
	toggleNavMenu = () => {
		this.setState({
			isShow: !this.state.isShow
		});
	}

	//卫星类别筛选
	SatFilter = (filterString: string) => {
		const entities = this.entities;
		const filterId: string[] = [];
		this.state.showBEIDOU = !this.state.showBEIDOU;
		this.setState({
			filterId: []
		});
		for (let i = 0; i < entities.values.length; i++) {
			const entity = entities.values[i];
			if (entity.id.indexOf(filterString) !== -1) {
				entity.show = this.state.showBEIDOU;
				const idArr = entity.id.split('/')
				if (idArr.length == 2 && idArr[0] == "Satellite") {
					filterId.push(entity.id)
				}
			}
		}
		this.setState({
			filterId
		});
	}

	// “GPS”筛选按钮
	GPS = () => {
		this.SatFilter('GPS');
	}
	// “BEIDOU”筛选按钮
	BEIDOU = () => {
		this.SatFilter('BEIDOU');
	}
	// “STARLINK”筛选按钮
	STARLINK = () => {
		this.SatFilter('STARLINK');
	}

	// 清空按钮
	clear = () => {
		const viewer = this.viewer;
		const entities = this.entities;
		for (let i = 0; i < entities.values.length; i++) {
			const entity = entities.values[i];
			entity.show = false;
		}
		this.setState({
			filterId: []
		});
	}

	// 还原按钮
	reset = () => {
		const entities = this.entities;
		const filterId: string[] = [];
		for (let i = 0; i < entities.values.length; i++) {
			const entity = entities.values[i];
			entity.show = true;
			const idArr = entity.id.split('/')
			if (idArr.length == 2 && idArr[0] == "Satellite") {
				filterId.push(entity.id)
			}
		}
		this.setState({
			filterId
		});
	}

	// 菜单项点击函数
	MenuItemClick = (index) => {
		const entities = this.entities
		for (let i = 0; i < entities.values.length; i++) {
			const entity = entities.values[i];
			if (entity.id === index) { // 选中实体
				entity.show = true;
			} else { // 非选中实体
				entity.show = false;
			}
		}
	};

	// 选城市
	selectCity = (cityName: string, entityId: string, suffix1: string, suffix2: string) => {
		const entities = this.entities;
		const cityArr: string[] = [];
		const filterId: string[] = [];
		this.state.showSTARLINK = !this.state.showSTARLINK;
		this.setState({
			filterId: []
		});
		for (let i = 0; i < entities.values.length; i++) {
			const entity = entities.values[i];
			const idArr = entity.id.split('/')
			if (idArr[0] == "Place" && (idArr[1] == entityId + suffix1 || idArr[1] == entityId + suffix2)) {
				cityArr.push(idArr.at(-1))
			}
		}
		for (let i = 0; i < entities.values.length; i++) {
			const entity = entities.values[i];
			entity.show = true;
			const idArr1 = entity.id.split('/')
			if (idArr1.length == 2 && idArr1[0] == "Satellite") {
				if (cityArr.includes(idArr1[1])) { filterId.push(entity.id) }
			}
		}
		this.setState({
			filterId,
			[cityName]: cityArr
		});
	}

	// 筛选基站
	selectsh = () => {
		this.selectCity('shanghai', 'ShangHai-to-Satellite', '', '1-to-Satellite');
	}

	selectbj = () => {
		this.selectCity('beijing', 'BeiJing-to-Satellite', '', '1-to-Satellite');
	}

	selectcq = () => {
		this.selectCity('chongqing', 'ChongQing-to-Satellite', '', '1-to-Satellite');
	}

	selectlos = () => {
		this.selectCity('los', 'Los-to-Satellite', '', '1-to-Satellite');
	}

	selectsea = () => {
		this.selectCity('seattle', 'Seattle-to-Satellite', '', '1-to-Satellite');
	}

	handleChange = (e) => {
		this.setState({ selectedLoc: e.target.value })
		if (e.target.value == "ShangHai") { this.selectsh() }
		if (e.target.value == "BeiJing") { this.selectbj() }
		if (e.target.value == "ChongQing") { this.selectcq() }
		if (e.target.value == "Los") { this.selectlos() }
		if (e.target.value == "Seattle") { this.selectsea() }
	}

	// 渲染组件
	render() {
		const { isShow, filterId, selectedLoc, selectedSat } = this.state;
		// 构建菜单项列表 绑定点击函数		
		const menuItems = (filterId as string[]).map((id) => {
			return <Menu.Item key={id} index={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				{id.split('/')[1].includes('GPS') && (
					<img src="./pic/gps-icon.png" alt="GPS icon" style={{ width: '30px', height: '30px', marginRight: '5px' }} />
				)}
				{id.split('/')[1].includes('BEIDOU') && (
					<img src="./pic/beidou-icon.png" alt="BEIDOU icon" style={{ width: '30px', height: '30px', marginRight: '5px' }} />
				)}
				{id.split('/')[1].includes('STARLINK') && (
					<img src="./pic/starlink-icon.png" alt="STARLINK icon" style={{ width: '30px', height: '30px', marginRight: '5px' }} />
				)}
				<span style={{ marginRight: 'auto' }}>{id.split('/')[1]}</span>
				<Button onClick={() => this.MenuItemClick(id)} style={{ width: '60px', height: '30px', display: 'flex', justifyContent: 'center' }}>Check</Button>
			</Menu.Item>

		})

		const satoptions = [
			{ value: 'GPS', label: 'GPS' },
			{ value: 'BEIDOU', label: 'BEIDOU' },
			{ value: 'STARLINK', label: 'STARLINK' },
		];

		return (
			<div id="main" style={{ position: 'relative' }}>
				<div id="cesiumContainer" className="cesiumContainer"></div>
				<div id="menu-container" className={isShow ? 'menu-show' : 'menu-hide'}>
					<Scrollbar>
						<Menu>
							<Button onClick={this.GPS}>GPS</Button>
							<Button onClick={this.BEIDOU}>北斗</Button>
							<Button onClick={this.STARLINK}>星链</Button>
							<br />
							<select onChange={(e) => this.handleChange(e)} defaultValue="" style={{ width: "60px", height: "35px", marginRight: "8px" }}>
								<option value="" style={{ display: 'none' }}>基站</option>
								<option value="ShangHai">上海</option>
								<option value="BeiJing">北京</option>
								<option value="ChongQing">重庆</option>
								<option value="Los">洛杉矶</option>
								<option value="Seattle">西雅图</option>
							</select>
							<Button onClick={this.clear}>清空</Button>
							<Button onClick={this.reset}>还原</Button>
							{menuItems}
						</Menu>
					</Scrollbar>
				</div>
				<div className="nav-menu" style={{ display: 'flex', alignItems: 'center',position: 'absolute', top: 0, left: 0 }}>
					<div style={{ position: 'relative', top: 0}}>
						<img
							src="./pic/upload.png"
							alt="选择图片"
							title="选择图片"
							style={{
								position: 'absolute',
								top: '30px',
								left: '1400px',
								zIndex: 1,
								cursor: 'pointer',
								width: '35px',
								height: '35px',
							}}
							onClick={() => document.getElementById('dcmfile').click()}
						/>
						<input
							className="choosefile"
							type="file"
							id="dcmfile"
							onChange={this.handleCzmlFileChange}
							style={{
								position: 'absolute',
								zIndex: 9,
								top: '0px',
								left: '5px',
								width: '100%',
								height: '100%',
								opacity: 0,
								cursor: 'pointer',
							}}
						/>
					</div>
					<Button className="nav-menu-btn" onClick={this.toggleNavMenu} style={{ marginLeft: '5px',marginTop:'5px' }}>
						{isShow ? '收起' : '展开'}
					</Button>
				</div>
			</div>
		);
	}
}

export default CesiumViewer;
