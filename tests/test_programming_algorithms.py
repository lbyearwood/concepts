"""Independent normal, absent, boundary and file-preservation cases for the taught algorithms."""
import builtins
import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest

PROBLEMS=json.loads((Path(__file__).resolve().parents[1]/'data/programming-problems.json').read_text(encoding='utf-8'))['problems']

def run(number, inputs=(), files=None):
    entered=iter(inputs)
    with tempfile.TemporaryDirectory() as directory:
        root=Path(directory)
        for name,text in (files or {}).items(): (root/name).write_text(text,encoding='utf-8')
        def local_open(name,mode): return builtins.open(root/name,mode,encoding='utf-8')
        scope={'__builtins__':dict(vars(builtins),input=lambda prompt='':next(entered),open=local_open)}
        output=io.StringIO()
        with contextlib.redirect_stdout(output): exec(compile(PROBLEMS[number-1]['solution'],f'problem-{number}','exec'),scope)
        saved={p.name:p.read_text(encoding='utf-8') for p in root.iterdir()}
    return output.getvalue(),saved,scope

CASES={
1:[(['Cab'],{},"The letter 'a' exists in the text.\n",{}),(['A'],{},"The letter 'a' does not exist in the text.\n",{}),([''],{},"The letter 'a' does not exist in the text.\n",{})],
2:[(['7'],{},'Found it!\nFound it!\n',{}),(['4'],{},'',{})],
3:[([],{},'cat\ndog\nrabbit\n',{})],
4:[([],{},'milk\nbread\neggs\n',{})],
5:[(['milk','green apples','eggs','milk','rice'],{},"You entered: ['milk', 'green apples', 'eggs', 'milk', 'rice']\n",{})],
6:[([],{},'First empty position at index 1\n',{})],
7:[([],{},'First match at index 5 with value 58\n',{})],
8:[(['2'],{},'Found at index 2\n',{}),(['11'],{},'',{})],
9:[(['Banana','a'],{},"The letter 'a' appeared 3 times.\n",{}),(['AaA','A'],{},"The letter 'a' appeared 3 times.\n",{}),(['','a'],{},"The letter 'a' appeared 0 times.\n",{}),(['rhythm','a'],{},"The letter 'a' appeared 0 times.\n",{})],
10:[([],{},'Even: 3 Odd: 2\n',{})],
11:[([],{},'Above: 3 Below or equal: 3\n',{})],
12:[([],{},'Numbers in range: 4\n',{})],
13:[(['Aisha','Khan'],{},'akhan\n',{}),(['Jean','Van Dyke'],{},'jvandyke\n',{}),(['   ','Khan'],{},'Enter both names.\n',{}),(['Aisha',''],{},'Enter both names.\n',{})],
14:[(['15'],{},'Ticket price: 6\n',{}),(['16'],{},'Ticket price: 10\n',{}),(['0'],{},'Ticket price: 6\n',{})],
15:[(['-1','101','100'],{},'Enter a score from 0 to 100.\nEnter a score from 0 to 100.\nAccepted score: 100\n',{}),(['0'],{},'Accepted score: 0\n',{}),(['100'],{},'Accepted score: 100\n',{})],
16:[([],{},'Total marks: 12\n',{})],
17:[([],{},'Restock items: [1, 3]\n',{})],
18:[([],{'visitors.txt':'Aisha\nSam Lee\n'},'Aisha\nSam Lee\n',{'visitors.txt':'Aisha\nSam Lee\n'}),([],{'visitors.txt':'Aisha\nSam Lee'},'Aisha\nSam Lee\n',{'visitors.txt':'Aisha\nSam Lee'}),([],{'visitors.txt':''},'',{'visitors.txt':''}),([],{'visitors.txt':'\n'},'\n',{'visitors.txt':'\n'})],
19:[(['Sam Lee'],{'members.txt':'Aisha\nBen\n'},'Member saved\n',{'members.txt':'Aisha\nBen\nSam Lee\n'}),(['Zoe'],{},'Member saved\n',{'members.txt':'Zoe\n'})],
20:[([],{'results.txt':'old data\n'},'',{'results.txt':'34,RETRY\n67,PASS\n80,PASS\n50,PASS\n49,RETRY\n'})],
21:[([],{'readings.txt':'24\n25\n31\n10\n'},'High readings: 2\n',{'readings.txt':'24\n25\n31\n10\n'}),([],{'readings.txt':''},'High readings: 0\n',{'readings.txt':''}),([],{'readings.txt':'25'},'High readings: 1\n',{'readings.txt':'25'})],
22:[([],{'bookings.txt':'Aisha,2\nBen,4\nSam,6\n','groups.txt':'stale\n'},'Bookings copied: 2\n',{'bookings.txt':'Aisha,2\nBen,4\nSam,6\n','groups.txt':'Ben,4\nSam,6\n'}),([],{'bookings.txt':''},'Bookings copied: 0\n',{'bookings.txt':'','groups.txt':''}),([],{'bookings.txt':'Zoe,3\n'},'Bookings copied: 0\n',{'bookings.txt':'Zoe,3\n','groups.txt':''}),([],{'bookings.txt':'Zoe,4'},'Bookings copied: 1\n',{'bookings.txt':'Zoe,4','groups.txt':'Zoe,4\n'})]
}
class AlgorithmTests(unittest.TestCase):
    def test_reusable_function_boundaries_and_independent_calls(self):
        _,_,scope=run(14,['16'])
        self.assertEqual([scope['ticket_price'](age) for age in (0,15,16,90)],[6,6,10,10])
        _,_,scope=run(15,['0'])
        self.assertEqual([scope['valid_score'](v) for v in (-1,0,100,101)],[False,True,True,False])
        _,_,scope=run(16)
        self.assertEqual([scope['total_marks'](v) for v in ([],[2,2],[1,0,5])],[0,4,6])
        _,_,scope=run(17)
        stock=[5,0,2]
        self.assertEqual(scope['restock_items'](stock,5),[1,2]);self.assertEqual(stock,[5,0,2])
        self.assertEqual(scope['restock_items']([],5),[])
        self.assertEqual(scope['restock_items']([5],5),[])
        self.assertEqual(scope['restock_items']([1,1],2),[0,1])

def cases_for(number):
    def test_cases(self):
        for index,(inputs,files,expected,expected_files) in enumerate(CASES[number]):
            with self.subTest(case=index):
                actual,saved,_=run(number,inputs,files)
                self.assertEqual(actual,expected)
                self.assertEqual(saved,expected_files)
    return test_cases
for number in CASES: setattr(AlgorithmTests,f'test_problem_{number:02}',cases_for(number))
