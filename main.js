let script_dolist;

function prompt_state(state_string)
{
  console.log("prompt_state: " + state_string);
  document.getElementById("state").innerHTML = state_string;
}

// "0123456".substring(1,3)

function parse_sexp(string){
	// without the outer parenthese
	let sexp = new Array();
	let collect = new String();

	let lexp = 0; let lstr = 1; let lquote = 2;
	let state = lexp; // exp, str, quote(quote string)

	err_func = function(err_string){
			prompt_state(err_string);
			return err_string;
	};

	for(let i=0; i<string.length; i++){
		let ch = string[i];
		switch(state){
		case lexp: // expression
			if(ch == " "){
				state = lexp;
			}else if(ch == "("){
				state = lexp;
				let level = 0;
				let quotep = false;
				for(let j=0; j+i<string.length; j++){
					let r = string[j+i];
					if(r == "\""){
						quotep = !quotep;
					}else if(r == "(" && !quotep){
						level++;
					}else if(r == ")" && !quotep){
						level--;
						if(level == 0){
							sexp.push(parse_sexp(string.substring(i+1, j+i)));
							i = i+j;
							break;}}}
				if(level != 0)
					return(err_func("SEXP-PARSER-UNBALANCED-PARENTHESE"));
			}else if(ch == "\""){
				state = lquote;
			}else if(ch == ")"){
				return(err_func("SEXP-PARSER-UNEXPECTED-RIGHT-PAREN"));
			}else{
				state = lstr;
				collect = collect + ch;
			}
			break;
		case lstr: // string
			if(ch == " "){
				state = lexp;
				sexp.push(collect);
				collect = new String();
			}else	if(ch == "("){
				state = lexp;
				sexp.push(collect);
				collect = new String();
				i--;
			}else if(ch == "\""){
				return(err_func("SEXP-PARSER-UNEXPECTED-QUOTE:" + string + "," + i));
			}else if(ch == ")"){
				return(err_func("SEXP-PARSER-UNEXPECTED-RIGHT-PAREN"));
			}else{
				collect = collect + ch;
			}
			break;
		case lquote: //quoted string
			if(ch == "\""){
				state = lexp;
				sexp.push(collect);
				collect = new String();
			}else{
				collect = collect + ch;
			}
			break;
		default:
			return(err_func("SEXP-PARSER-UNKNOWN-ERROR"));
			break;
		}
		// good
	}

	if(state == lstr){
		sexp.push(collect);
	}

	return sexp;
}

function parse_line(line, callback_err)
{
	let line_command = new Array();
	// empty line
	if(line.length == 0)
		return;
	// comment
	if(line[0] == "#")
		return;
}

function parse_dolist_f(script_string)
{
  let splited = script_string.split("\n");
  let stripped = new Array();
	let line_num = 0;
	let count = 0;
  for(let i=0; i<splited.length; i++){
    stripped.push(splited[i]);
		count++;
		line_num++;
  }
  script_dolist = stripped;
	return count;
}

function show_txt()
// for debug
{
  for(let i=0; i<script_dolist.length; i++){
    var para = document.createElement("p");
    para.innerHTML = script_dolist[i];
    document.getElementById("log").appendChild(para);
  }
}

// script_url: './foo.txt'
function load_script(script_url, callback)
{
	prompt_state("Downloading script file...");
	let client = new XMLHttpRequest();
	client.open('GET', script_url);
	client.onreadystatechange = function() {
		if(client.readyState == 4){
			callback(client.responseText);
		}
	}
	client.send();
}

loader = function(){
	load_script("./foo.txt", function(string){
		prompt_state("Script download complete! Parsing...");
		let item_number = parse_dolist_f(string);
		prompt_state("Parsing complete, " + item_number + " items.");
		show_txt();
	});
};
