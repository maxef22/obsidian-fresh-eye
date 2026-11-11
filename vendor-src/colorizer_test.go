// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

package fresheye_test

import (
	"testing"

	"gitlab.com/opennota/fresheye"
	"gitlab.com/opennota/wd"
)

func TestToColoredHTML(t *testing.T) {
	const input = `"Дул ветер...", – написав это, я опрокинул неосторожным движением чернильницу, и цвет блестящей лужицы напомнил мне мрак той ночи, когда я лежал в кубрике "Эспаньолы". Это суденышко едва поднимало шесть тонн, на нем прибыла партия сушеной рыбы из Мазабу. Некоторым нравится запах сушеной рыбы.

Все судно пропахло ужасом, и, лежа один в кубрике с окном, заткнутым тряпкой, при свете скраденной у шкипера Гро свечи, я занимался рассматриванием переплета книги, страницы которой были выдраны неким практичным чтецом, а переплет я нашел.

На внутренней стороне переплета было написано рыжими чернилами: "Сомнительно, чтобы умный человек стал читать такую книгу, где одни выдумки".

Ниже стояло: "Дик Фармерон. Люблю тебя, Грета. Твой Д.".

На правой стороне человек, носивший имя Лазарь Норман, расписался двадцать четыре раза с хвостиками и всеобъемлющими росчерками. Еще кто-то решительно зачеркнул рукописание Нормана и в самом низу оставил загадочные слова: "Что знаем мы о себе?"

Я с грустью перечитывал эти слова. Мне было шестнадцать лет, но я уже знал, как больно жалит пчела – Грусть. Надпись в особенности терзала тем, что недавно парни с "Мелузины", напоив меня особым коктейлем, испортили мне кожу на правой руке, выколов татуировку в виде трех слов: "Я все знаю". Они высмеяли меня за то, что я читал книги, – прочел много книг и мог ответить на такие вопросы, какие им никогда не приходили в голову.

Я засучил рукав. Вокруг свежей татуировки розовела вспухшая кожа. Я думал, так ли уж глупы эти слова "Я все знаю"; затем развеселился и стал хохотать – понял, что глупы.
`
	const want = "&#34;Дул ветер...&#34;, – написав это, я опрокинул неосторожным движением чернильницу, и цвет блестящей <span style=\"background-color: #fde3ff\">лужицы</span> напомнил мне мрак той ночи, когда я <span style=\"background-color: #fde3ff\">лежал</span> в кубрике &#34;Эспаньолы&#34;. Это <span style=\"background-color: #ffe8d5\">суденышко</span> едва поднимало шесть тонн, на нем <span style=\"background-color: #d1ffd5\">прибыла</span> партия <span style=\"background-color: #ffb97e\">сушеной</span> <span style=\"background-color: #96ff9e\">рыбы</span> из Мазабу. Некоторым нравится <span style=\"background-color: #fde2ff\">запах</span> <span style=\"background-color: #ffb97e\">сушеной</span> <span style=\"background-color: #96ff9e\">рыбы</span>.<br>\n<br>\nВсе судно <span style=\"background-color: #fde2ff\">пропахло</span> ужасом, и, лежа один в кубрике с окном, заткнутым тряпкой, при <span style=\"background-color: #ffe7d3\">свете</span> скраденной у шкипера Гро <span style=\"background-color: #ffe7d3\">свечи</span>, я занимался рассматриванием <span style=\"background-color: #f79fff\">переплета</span> книги, <span style=\"background-color: #e1ffe3\">страницы</span> которой <span style=\"background-color: #ffe6d1\">были</span> <span style=\"background-color: #e1ffe3\">выдраны</span> неким практичным чтецом, а <span style=\"background-color: #f697ff\">переплет</span> я нашел.<br>\n<br>\nНа внутренней стороне <span style=\"background-color: #f697ff\">переплета</span> <span style=\"background-color: #ffe6d1\">было</span> написано рыжими чернилами: &#34;Сомнительно, чтобы умный <span style=\"background-color: #e3ffe6\">человек</span> стал читать такую книгу, где одни выдумки&#34;.<br>\n<br>\nНиже стояло: &#34;Дик Фармерон. Люблю тебя, Грета. Твой Д.&#34;.<br>\n<br>\nНа правой стороне <span style=\"background-color: #e3ffe6\">человек</span>, носивший имя <span style=\"background-color: #fbd0ff\">Лазарь</span> <span style=\"background-color: #ffe2c9\">Норман</span>, расписался двадцать четыре <span style=\"background-color: #fbd0ff\">раза</span> с хвостиками и всеобъемлющими росчерками. Еще кто-то решительно зачеркнул рукописание <span style=\"background-color: #ffe2c9\">Нормана</span> и в самом низу оставил загадочные <span style=\"background-color: #b9ffbe\">слова</span>: &#34;Что знаем мы о себе?&#34;<br>\n<br>\nЯ с <span style=\"background-color: #ffd7b6\">грустью</span> перечитывал эти <span style=\"background-color: #b9ffbe\">слова</span>. Мне <span style=\"background-color: #fde6ff\">было</span> шестнадцать лет, но я уже знал, как <span style=\"background-color: #fde6ff\">больно</span> жалит пчела – <span style=\"background-color: #ffd7b6\">Грусть</span>. Надпись в <span style=\"background-color: #ceffd2\">особенности</span> терзала тем, что недавно парни с &#34;Мелузины&#34;, напоив <span style=\"background-color: #fcdfff\">меня</span> <span style=\"background-color: #ceffd2\">особым</span> коктейлем, испортили мне кожу на правой руке, выколов татуировку в виде трех слов: &#34;Я все знаю&#34;. Они высмеяли <span style=\"background-color: #fcdfff\">меня</span> за то, что я читал <span style=\"background-color: #ffd5b1\">книги</span>, – прочел <span style=\"background-color: #e5ffe7\">много</span> <span style=\"background-color: #ffd5b1\">книг</span> и <span style=\"background-color: #e5ffe7\">мог</span> ответить на <span style=\"background-color: #fac0ff\">такие</span> вопросы, <span style=\"background-color: #fac0ff\">какие</span> им никогда не приходили в голову.<br>\n<br>\nЯ засучил рукав. Вокруг свежей <span style=\"background-color: #fff0e4\">татуировки</span> розовела вспухшая кожа. Я думал, <span style=\"background-color: #fff0e4\">так</span> ли уж <span style=\"background-color: #9cffa3\">глупы</span> эти слова &#34;Я все знаю&#34;; затем развеселился и стал хохотать – понял, что <span style=\"background-color: #9cffa3\">глупы</span>.<br>\n"
	if got := fresheye.ToColoredHTML(input, 20, 400, false); got != want {
		diff := wd.ColouredDiff(got, want, true)
		t.Errorf("ToColoredHTML:\n%v", diff)
	}
}
