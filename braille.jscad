var debug = false;
var parameters = null;
var master_dot = null;

var colorDot = [0.2, 0.2, 0.2];
var colorPlate = [1.0, 1.0, 1.0];
var colorInside = [0.0, 0.0, 0.0];
var colorSupport = [0.7, 1, 0.7];

var characters =
{
	"a" : 1,	//⠁
	"b" : 12,	//⠃
	"c" : 14,	//⠉
	"d" : 145,	//⠙
	"e" : 15,	//⠑
	"f" : 124,	//⠋
	"g" : 1245,	//⠛
	"h" : 125,	//⠓
	"i" : 24,	//⠊
	"j" : 245,	//⠚
	"k" : 13,	//⠅
	"l" : 123,	//⠇
	"m" : 134,	//⠍
	"n" : 1345,	//⠝
	"o" : 135,	//⠕
	"p" : 1234,	//⠏
	"q" : 12345,//⠟
	"r" : 1235,	//⠗
	"s" : 234,	//⠎
	"t" : 2345,	//⠞
	"u" : 136,	//⠥
	"v" : 1236,	//⠧
	"w" : 2456,	//⠺
	"x" : 1346,	//⠭
	"y" : 13456,//⠽
	"z" : 1356,	//⠵

	"1" : 1,	//⠁
	"2" : 12,	//⠃
	"3" : 14,	//⠉
	"4" : 145,	//⠙
	"5" : 15,	//⠑
	"6" : 124,	//⠋
	"7" : 1245,	//⠛
	"8" : 125,	//⠓
	"9" : 24,	//⠊
	"0" : 245,	//⠚
	
	"ç" : 12346,  // 
	"é" : 123456,
	"á" : 12356,
	"è" : 2346,
	"ú" : 23456,
	"â" : 16,
	"ê" : 126,
	"ì" : 146,
	"ô" : 1456,
	"@" : 156,
	"à" : 1246,
	"ñ" : 12456,
	"ü" : 1256,
	"õ" : 246,
	"w" : 2456,
	"í" : 34,
	"ã" : 345,
	"ó" : 346,
	
	"&" : 12346,//⠯
	"%" : 123456,//⠿
	"[" : 12356,//⠷
	"]" : 23456,//⠾
	"`" : 1246,	//⠫
	"^" : 12456,//⠻
	"#" : 3456,	//⠼
	"$" : 46,	//⠨
	"." : 3,	//⠄
	"," : 2,	//⠂
	":" : 25,	//⠒
	";" : 23,	//⠆
	">" : 45,	//⠘
	"<" : 56,	//⠰
	"»" : 236,	//⠦
	"«" : 356,	//⠴
	"(" : 2356,	//⠶
	")" : 2356,	//⠶
	"=" : 2356,	//⠶
	"-" : 36,	//⠤
	"+" : 235,	//⠖
	"!" : 235,	//⠖
	"*" : 35,	//⠔
	"/" : 256,	//⠲
	"?" : 26,	//⠢
	//"'" : 6,	//⠠
	//'"' : 4,	//⠈
	"_" : 456,	//⠸
	"~" : 5,	//⠐
	"§" : 346,	//⠬
	" " : 0,	//⠀
	"º" : 356,
	"|" : 456
};

function log(text)
{
	if (OpenJsCad.log && debug)
		OpenJsCad.log(text);
}

function form_base()
{
	if (parameters.plate_thickness <= 0.0)
		return new CSG();
	
	var dimensions = [parameters.form_distance/2, parameters.line_height/2, parameters.plate_thickness/2];
	var offset = [parameters.form_distance/2, -parameters.line_height/2, -parameters.plate_thickness/2];
	
	return CSG.cube({ center: offset, radius: dimensions });
}

function rotateZ_extrude(obj2d, resolution)
{
	return obj2d.solidFromSlices({
		numslices: resolution,
		loop : true,
		callback: function(t, slice) {
			return this.rotateZ(360/resolution*slice);
		}
	});
}

function ring(radius1, radius2, resolution)
{	
	points = new Array(resolution);
	for (var i=0; i<resolution; i++)
	{
		var t = i/resolution;
		var angle = Math.PI * 2 * t;
		var x = radius1 * Math.cos(angle);
		var z = radius1 * Math.sin(angle);
		points[i] = [x,0,z];
	}
	
	var circle = CSG.Polygon.createFromPoints(points).translate([radius2-radius1,0,0]);
	return rotateZ_extrude(circle, resolution);
}

function sized_dot()
{
	if (master_dot == null)
	{
		var dot;
		if (parameters.dot_shape == 'sphere')
		{
			dot = CSG.sphere({ center: [0, 0, 0], radius: 1, resolution: parameters.resolution });
			var sub = CSG.cube({ center: [0, 0, 0], radius: [1.25, 1.25, 1] }).translate([0, 0, -1.05]);
			dot = dot.subtract(sub);
		}
		else if (parameters.dot_shape == 'cylinder')
		{
			dot = CSG.cylinder({ start: [0, 0, -0.05], end: [0, 0, 1], radius: 1, resolution: parameters.resolution });
		}
		else if (parameters.dot_shape == 'smooth')
		{
			dot = CSG.sphere({ center: [0, 0, 1], radius: 1, resolution: parameters.resolution });
			dot = dot.scale([1, 1, 0.5]);
		}
		else
		{
			throw new Error("Unknown dot shape '" + parameters.dot_shape + "'");
		}
		
		dot = dot.scale([parameters.dot_diameter/2, parameters.dot_diameter/2, parameters.dot_height]);
		dot = dot.setColor(colorDot[0], colorDot[1], colorDot[2]);
		
		//final touch of 'smooth' is best done after scaling
		if (parameters.dot_shape == 'smooth')
		{
			var ringRadius1 = parameters.dot_height / 2;
			var ringRadius2 = parameters.dot_diameter/2 + parameters.dot_height;
			
			var base = CSG.cylinder({ start: [0, 0, -0.05], end: [0, 0, ringRadius1], radius: ringRadius2-ringRadius1, resolution: parameters.resolution });
			base = base.setColor(colorPlate[0], colorPlate[1], colorPlate[2]);
			var smoother = ring(ringRadius1, ringRadius2, parameters.resolution).translate([0, 0, ringRadius1]);
			smoother = smoother.setColor(colorPlate[0], colorPlate[1], colorPlate[2]);
			dot = dot.union(base).subtract(smoother);
		}
		
		master_dot = dot;
	}
	return CSG.fromObject(master_dot);
}

function dot(x, y)
{
	var x_pos = (parameters.form_distance - parameters.dot_distance) / 2 + (x-1) * parameters.dot_distance;
	var y_pos = -(parameters.line_height - parameters.dot_distance*2) / 2 - (y-1) * parameters.dot_distance;
	
	var the_dot = sized_dot();
	the_dot = the_dot.translate([x_pos, y_pos, 0]);
	
	return the_dot;
}

function characterByCode(charCode)
{
	var dotArray = [];
	
	while (charCode > 0)
	{
		var dotCode = (charCode % 10) - 1;
		charCode = Math.floor(charCode / 10);
		if (dotCode < 0)
			continue;
		
		dotArray.unshift([dotCode < 3 ? 1 : 2, (dotCode % 3) + 1]);
	}
	
	return characterByDots(dotArray);
}

function characterByDots(dots)
{
	var theCharacter = new Array(dots.length);
	
	for (var i=0; i < dots.length; i++)
	{
		theCharacter[i] = dot(dots[i][0], dots[i][1]);
	}
	
	return theCharacter;
}

function generate(text)
{
	log("generating:\n" + text);
	
	if (!parameters.upper)
		text = text.toLowerCase();
	
	var result = new CSG();
	if (text.length == 0)
		return result;
	
	var find;
	var replace;
	
	//we want uniform newlines for further processing!
	find = /\n\r|\r\n|\r/;
	replace = "\n";
	text.replace(find, replace);
	
	if (!parameters.straight)
	{
		//the regex unicode matching for uppercase letters (not supported in js):
		// var find = /([\p{Lu}])/g;
		// var replace = "$\L$1";
		
		//a WHOLE WORD in uppercase letters is prefaced by the character >
		//TODO: make this combinable with single uppercase letters!
		// find = /(\s|^)([A-ZÄÖÜ]+)(?=\s|$)/g;
		// replace = "$1>$2";
		// text = text.replace(find, replace).toLowerCase();
		
		//single uppercase letters are prefaced by the character $
		find = /([A-ZÄÖÜ])/g;
		replace = "$$$1";
		text = text.replace(find, replace).toLowerCase();
		
		//numbers are prefaced by the character #
		find = /([\d]+)/g;
		replace = "#$1";
		text = text.replace(find, replace);
		
		//is the number followed by a character between 'a' and 'j', a ' is inserted to avoid confusion
		find = /([\d])(?=[a-j])/g;
		replace = "$1'";
		text = text.replace(find, replace);
		
		//replace quotes with opening and closing quotes
		find = /"([^"]*)"/g;
		replace = "»$1«";
		// find = /(\s|^)"([^"]*)"(?=\s|$)/g;		//unsure about this
		// replace = "$1»$2«";
		text = text.replace(find, replace);
	}
	
	//take care of contractions. they are marked by underlines (_xy_), thus _ needs to be escaped (__)
	find = /(_)/g;
	replace = "$1$1";
	text = text.replace(find, replace);
	
	if (parameters.contractions)
	{
		find = /(st|au|eu|ei|sch|ch|äu|ie)/g;
		replace = "_$1_";
		text = text.replace(find, replace);
	}
	
	log("converting to:\n" + text);
	
	
	var numLines = 1;
	var textWidth = 0;
	var lineWidth = 0;
	
	var theCharacters = [];
	
	var offset = new CSG.Vector3D(parameters.plate_margin, -parameters.plate_margin, 0);
	
	var isMultiCharForm = false;
	var multiChars = "";
	
	for (var c=0; c < text.length; c++)
	{
		var newCharacter = text.charAt(c);
		
		var multiChar = newCharacter == '_';
		if (isMultiCharForm)
		{
			if (multiChar)
			{
				newCharacter = (multiChars.length == 0) ? "_" : multiChars;
				isMultiCharForm = false;
				multiChars = "";
			}
			else
			{
				multiChars += newCharacter;
				continue;
			}
		}
		else if (multiChar)
		{
			isMultiCharForm = true;
			continue;
		}
		else if (newCharacter == "\n")
		{
			numLines++;
			lineWidth = 0;
			log("\n");
			continue;
		}
		
		lineWidth++;
		
		var charCode = characters[newCharacter];
		
		if (typeof charCode == "undefined")
		{
			charCode = characters["?"];
			throw new Error("Unsupported character '" + newCharacter + "'");
		}
		
		if (charCode > 0)
			textWidth = Math.max(textWidth, lineWidth);
		
		var characterDots = characterByCode(charCode);
		var position = offset.plus(new CSG.Vector3D(parameters.form_distance * (lineWidth-1), parameters.line_height * -(numLines-1), 0));
		for (var cp=0; cp < characterDots.length; cp++)
			characterDots[cp] = characterDots[cp].translate([position.x, position.y, position.z]);
		
		theCharacters = theCharacters.concat(characterDots);
		
		log(newCharacter);
	}
	
	var marginFactor = [(parameters.plate_margin*2)/parameters.form_distance, (parameters.plate_margin*2)/parameters.line_height];
	result = form_base().scale([textWidth + marginFactor[0], numLines + marginFactor[1], 1]);
	result = result.setColor(colorPlate[0], colorPlate[1], colorPlate[2]);
	
	result = result.union(theCharacters);
	
	if (parameters.reference_corner && parameters.plate_margin > 0)
	{
		var cornerCut = CSG.cube({ center: [0, 0, 0], radius: [parameters.plate_margin, parameters.plate_margin/2, parameters.plate_thickness] }).rotateZ(45);
		cornerCut = cornerCut.setColor(colorInside[0], colorInside[1], colorInside[2]);
		result = result.subtract(cornerCut);
	}
	
	var dimensions = [textWidth*parameters.form_distance+parameters.plate_margin*2, numLines*parameters.line_height+parameters.plate_margin*2];
	result = result.translate([-dimensions[0]/2, dimensions[1], 0]).rotateX(90);
	
	if (parameters.stands)
	{
		var standDiameter = 10.0;
		var standHeight = 0.3;
		var bounds = result.getBounds();
		var standCircle = CSG.cylinder({ start: [0, 0, 0], end: [0, 0, standHeight], radius: standDiameter/2, resolution: parameters.resolution });
		var stand = CSG.cube({ center: [0, parameters.plate_thickness/2, standHeight/2], radius: [bounds[1].x + standDiameter/2, parameters.plate_thickness/2, standHeight/2] });
		stand = stand.union(standCircle.translate([bounds[0].x - standDiameter/2, parameters.plate_thickness/2, 0]));
		stand = stand.union(standCircle.translate([bounds[1].x + standDiameter/2, parameters.plate_thickness/2, 0]));
		stand = stand.setColor(colorSupport[0], colorSupport[1], colorSupport[2]);
		
		result = result.union(stand);
	}
	
	return result;
}



function getParameterDefinitions()
{
	var debug = false;
	
	var parameterDefinitions = [
		{ name: 'text', caption: 'Texto', type: 'longtext', initial: 'Olá Mundo' },
		{ name: 'upper', caption: 'Maiúsculo', type: 'bool', initial: false, visible: false },
		{ name: 'contractions', caption: 'Contrações', type: 'bool', initial: false, visible: false },
		{ name: 'straight', caption: 'Conversão direta', type: 'bool', initial: false, visible: false },
	
		{ name: 'form_size', caption: 'Tamanho do formulário [0mm - 10mm]', type: 'float', initial: 5.0, visible: false },
	    { name: 'dot_distance', caption: 'Distância entre pontos [default: 2.7mm]:', type: 'float', initial: 2.7, begin: 1.6, end: 2.7, step: 0.01, visible: false},
		//  { name: 'form_distance', caption: 'Form-Abstand', type: 'float', initial: 6.6},
		//  { name: 'line_height', caption: 'Zeilen-Höhe', type: 'float', initial: 10.8, visible: false },
	  	{ name: 'dot_height', caption: 'Altura do ponto [default: 0.75mm]:', type: 'range', initial: 0.75,  begin: 0.6, end: 0.8, step: 0.01},
		{ name: 'dot_diameter', caption: 'Diâmetro do ponto [default: 1.9mm]:', type: 'range', initial: 1.9, begin: 1.2, end: 2.0, step: 0.01 },
	
		{ name: 'plate_thickness', caption: 'Espessura da placa (mm):', type: 'float', initial: 2.0 },
		{ name: 'plate_margin', caption: 'Margem da placa (mm):', type: 'float', initial: 5.0 },
	
		{ name: 'reference_corner', caption: 'Gerar canto de referência ?', type: 'bool', initial: true },
		{ name: 'stands', caption: 'Gerar apoios para impressão ?', type: 'bool', initial: true },

		{ name: 'resolution', caption: 'Resolução', type: 'int', initial: 16, visible: false },
		{ name: 'dot_shape', caption: 'Formato do ponto', type: 'choice', values: ['sphere', 'cylinder', 'smooth'], captions: ['Esfera', 'Cilindro', 'Plano'], initial: 'smooth' , visible: false },
		//{ name: 'debug_dot', caption: 'Debug dot', type: 'bool', initial: false, visible: debug }
	];
	
	return parameterDefinitions;
}

function main(params)
{
	log("start");
	
	parameters = params;
	master_dot = null;
	
	var formFactor = parameters.form_size / 10.0;
	parameters.dot_distance = parameters.dot_distance + 0.7 * formFactor;
	parameters.form_distance = parameters.dot_distance * 2.5;
	parameters.line_height = parameters.dot_distance * 4.0;
	
	var result;
	if (parameters.debug_dot)
		result = sized_dot().scale([3, 3, 3]);
	else
		result = generate(parameters.text);
	
	log("finish");
	
	return result;
}
