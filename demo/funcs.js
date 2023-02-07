function upload_file() {
    var user_file = document.getElementById("user_csv");
    var remove_html = '<a onclick="this.parentNode.parentNode.remove()">Remove</a>';
    if (!user_file.value.toLowerCase().endsWith('.csv')){
        alert('Please upload a .csv file');
        return;
    }
    var reader = new FileReader();
    reader.onload = function(f) {
        var table = document.getElementById("tbCSV");
        var rows = f.target.result.split("\n");
        for (var i = 1; i < rows.length; i++) {
            var cells = rows[i].split(",");
            if (cells.length > 1) {
                var row = table.insertRow(-1);
                for (var j = 0; j < cells.length; j++) {
                    var cell = row.insertCell(-1);
                    cell.innerHTML = cells[j];
                }
                var cell = row.insertCell(-1);
                cell.setAttribute('contenteditable', false);
                cell.innerHTML = remove_html;
            }
        }
        var dvCSV = document.getElementById("dvCSV");
        dvCSV.innerHTML = "";
        dvCSV.appendChild(table);
    }
    reader.readAsText(user_file.files[0]);
}


function manual_add_food() {

    var values = [];
    var t;
    for (var i = 0; i < 11; i++) {
        t = document.getElementById(`t${i}`).value;
        console.log(t > 2);
        if (t == '') {
            alert('Please fill in all values for the food you want to add.');
            return 0;
        }
        if (i > 0 && t < 0) {
            alert('There cannot be negative values of nutrition.');
            return 0;
        }
        values.push(t);
    }
    var table = document.getElementById("tbCSV");
    var row = table.insertRow(-1);
    for (var i = 0; i < 11; i++) {
        var cell = row.insertCell(-1);
        cell.innerHTML = values[i];
        document.getElementById(`t${i}`).value = '';
    }
    var cell = row.insertCell(-1);
    cell.setAttribute('contenteditable', false);
    cell.innerHTML = '<a onclick="this.parentNode.parentNode.remove()">Remove</a>';
}


function ranges(bounds) {
    var range_list = [];
    for (var i = 0; i < bounds.length; i++) {
        var temp_r = [];
        for (var j = bounds[i][0]; j < bounds[i][1] + 1; j++) {
            temp_r.push(j);
        }
        range_list.push(temp_r);
    }
    return range_list;
}


function* ranged_combinations(head, ...tail) {
    const remainder = tail.length > 0 ? ranged_combinations(...tail) : [
        []
    ];
    for (let r of remainder)
        for (let h of head) yield [h, ...r];
}


function get_table() {
    var full_data = [];
    var table = document.getElementById('tbCSV');
    for (var i = 2; i < table.rows.length; i++) {
        var ith_row = table.rows.item(i).cells;
        var ith_arr = [];
        ith_arr.push(ith_row.item(0).innerHTML);
        for (var j = 1; j < ith_row.length - 1; j++) {
            var cell = parseFloat(ith_row.item(j).innerHTML);
            ith_arr.push(cell)
        }
        full_data.push(ith_arr);
    }
    return full_data;
}


function get_targets() {
    var targets = [];
    for (var i = 0; i < 8; i++) {
        targets.push(parseFloat(document.getElementById(`tr${i}`).value));
    }
    return targets;
}


function get_weights() {
    var weights = [];
    for (var i = 0; i < 8; i++) {
        weights.push(parseFloat(document.getElementById(`w${i}`).value));
    }
    return weights;
}


function get_pref() {
    var pref = [];
    for (var i = 0; i < 8; i++) {
        pref.push(document.getElementById(`s${i}`).value);
    }
    return pref;
}


function calc_total(nutr_arr, combo) {
    var t = [];
    for (var i = 0; i < 8; i++) {
        t.push(0);
    }
    for (var food_ind = 0; food_ind < nutr_arr.length; food_ind++) {
        for (var nutr_ind = 0; nutr_ind < 8; nutr_ind++) {
            t[nutr_ind] += combo[food_ind] * nutr_arr[food_ind][nutr_ind];
        }
    }
    return t;
}


function weighted_distance(totals, target, weights, pref) {
    // there is an issue with this right now
    var dist = 0;
    for (var i = 0; i < 8; i++) {
        if (pref[i] == 'close') {
            dist += Math.abs(target[i] - totals[i]) * weights[i];
        } else if (pref[i] == 'over') {
            if (totals[i] < target[i]) {
                dist += (target[i] - totals[i]) * weights[i];
            }
        } else if (pref[i] == 'under') {
            if (totals[i] > target[i]) {
                dist += (totals[i] - target[i]) * weights[i];
            }
        }
    }
    return dist;
}


function best_combos(food_list, target, pref, n_combos = 20, weights = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]) {

    var scored_combos = [];
    var nutrients_array = [];
    var bounds = [];
    var n_foods = food_list.length;

    var bounds = [];
    for (var i = 0; i < n_foods; i++) {
        nutrients_array.push(food_list[i].slice(1));
        bounds.push([food_list[i][9], food_list[i][10]]);
    }

    var range_list = ranges(bounds);
    var combos = ranged_combinations(...range_list);
    var combo;
    var distance;

    for (var i = 0; i < n_combos; i++) {
        combo = combos.next().value;
        totals = calc_total(nutrients_array, combo);
        distance = weighted_distance(totals, target, weights, pref);
        scored_combos.push([distance, combo, totals])
    }
    scored_combos.sort();
    var high_incl_dist = scored_combos[n_combos - 1][0];

    for (var c of combos) {
        totals = calc_total(nutrients_array, c);
        distance = weighted_distance(totals, target, weights, pref);
        if (distance < high_incl_dist) {
            scored_combos.splice(-1);
            high_incl_dist = scored_combos[n_combos - 2][0];
            if (distance > scored_combos[n_combos - 2][0]) {
                scored_combos.push([distance, c, totals]);
                continue;
            }
            for (var j = 0; j < n_combos - 1; j++) {
                if (distance <= scored_combos[j][0]) {
                    scored_combos.splice(j, 0, [distance, c, totals]);
                    break;
                }
            }
        }
    }
    return scored_combos;
}


function add_result(food_list, combo) {
    var ul = document.createElement('ul');
    var item_str;
    for (var i = 0; i < combo.length; i++) {
        if (combo[i] > 0) {
            item_str = `${combo[i]} x ${food_list[i][0]}`;
            var li = document.createElement('li');
            li.textContent = item_str;
            ul.append(li);
        }
    }
    return ul;
}


function solve_foods() {
    document.getElementById('sol_list').innerHTML = '';
    var food_list = get_table();
    var target = get_targets();
    var weights = get_weights();
    var pref = get_pref();
    var printable_combos = best_combos(food_list, target, pref, 20, weights);
    for (var i = 0; i < printable_combos.length; i++) {
        var div = document.createElement('div');
        div.className = 'fdiv';
        var p = document.createElement('p');
        var p2 = document.createElement('p');
        var text = document.createTextNode(`Option #${i+1}`);
        var text2 = document.createTextNode(`Weighted Distance: ${Math.round(printable_combos[i][0])}`)
        var ul = add_result(food_list, printable_combos[i][1]);
        ul.className = 'flist';
        p.appendChild(text);
        p2.appendChild(text2);
        div.appendChild(p);
        div.appendChild(ul);
        div.appendChild(p2);

        var total_table = document.createElement('table');
        total_table.className = 'nutrTb';
        var r1 = total_table.insertRow(-1);
        var r2 = total_table.insertRow(-1);
        var attr = ['Calories', 'Fat', 'Chol.', 'Sodium', 'Carbs', 'Fiber', 'Sugars', 'Protein'];
        var cell;
        for (var j = 0; j < 8; j++) {
            cell = r1.insertCell(-1);
            cell.innerHTML = attr[j];
            cell = r2.insertCell(-1);
            cell.innerHTML = printable_combos[i][2][j].toString();
        }
        div.appendChild(total_table);

        document.getElementById('sol_list').appendChild(div);
    }
}
