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
)

func TestSimpleWordIterator(t *testing.T) {
	const text = `На правой стороне человек, носивший имя Лазарь Норман, расписался двадцать четыре раза с хвостиками и всеобъемлющими росчерками.
Еще кто-то решительно зачеркнул рукописание Нормана и в самом низу оставил загадочные слова: "Что знаем мы о себе?"`
	it := fresheye.NewSimpleWordIterator(text)
	words := []string{"На", "правой", "стороне", "человек", "носивший", "имя", "Лазарь", "Норман", "расписался", "двадцать", "четыре", "раза", "с", "хвостиками", "и", "всеобъемлющими", "росчерками", "Еще", "кто", "то", "решительно", "зачеркнул", "рукописание", "Нормана", "и", "в", "самом", "низу", "оставил", "загадочные", "слова", "Что", "знаем", "мы", "о", "себе"}
	seps := []string{"", " ", " ", " ", ", ", " ", " ", " ", ", ", " ", " ", " ", " ", " ", " ", " ", " ", ".\n", " ", "-", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", `: "`, " ", " ", " ", " "}
	i := 0
	pars := make([]bool, len(words))
	pars[0] = true
	pars[17] = true
	startEnd := [][2]int{
		{0, 4},
		{5, 17},
		{18, 32},
		{33, 47},
		{49, 65},
		{66, 72},
		{73, 85},
		{86, 98},
		{100, 120},
		{121, 137},
		{138, 150},
		{151, 159},
		{160, 162},
		{163, 183},
		{184, 186},
		{187, 215},
		{216, 236},
		{238, 244},
		{245, 251},
		{252, 256},
		{257, 277},
		{278, 296},
		{297, 319},
		{320, 334},
		{335, 337},
		{338, 340},
		{341, 351},
		{352, 360},
		{361, 375},
		{376, 396},
		{397, 407},
		{410, 416},
		{417, 427},
		{428, 432},
		{433, 435},
		{436, 444},
	}
	for it.Next() {
		word := it.Word()
		sep := it.Sep()
		par := it.ParagraphStart()
		d := it.Descriptor()
		if word != words[i] {
			t.Errorf("Word[%d]: want %q, got %q", i, words[i], word)
		}
		if sep != seps[i] {
			t.Errorf("Sep[%d]: want %q, got %q", i, seps[i], sep)
		}
		if par != pars[i] {
			t.Errorf("ParagraphStart[%d]: want %v, got %v", i, pars[i], par)
		}
		if d.Start() != startEnd[i][0] || d.End() != startEnd[i][1] {
			t.Errorf("d.Start[%d] / d.End[%d]: want %v, got %v", i, i, startEnd[i], [2]int{d.Start(), d.End()})
		}
		i++
	}
}
