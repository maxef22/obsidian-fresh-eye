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

package fresheye

import (
	"testing"
)

func TestInforSameDiff(t *testing.T) {
	testCases := []struct {
		a, b string
		want [2]float64
	}{
		{"шкипера", "переплета", [2]float64{894.5, 4661}},
		{"переплета", "шкипера", [2]float64{883.4285714285714, 4661}},
		{"лужицы", "лежал", [2]float64{1354, 6264}},
		{"особым", "особенности", [2]float64{918.75, 6351}},
		{"запах", "пропахло", [2]float64{987.75, 4279}},
		{"выколов", "слов", [2]float64{849, 3018}},
	}
	for _, tc := range testCases {
		got := inforSameDiff(toFnord(tc.a), toFnord(tc.b))
		if got != tc.want {
			t.Errorf("inforSameDiff(%q, %q): want %v, got %v", tc.a, tc.b, tc.want, got)
		}
	}
}

func TestWordSimilarity(t *testing.T) {
	testCases := []struct {
		a, b string
		want float64
	}{
		{"шкипера", "переплета", 214.70387507415273},
		{"переплета", "шкипера", 214.70387507415273},
		{"лужицы", "лежал", 454.6748372891439},
		{"особым", "особенности", 652.7981153335286},
		{"запах", "пропахло", 467.8451462363338},
		{"выколов", "слов", 217.15781306460204},
	}
	for _, tc := range testCases {
		got := wordSimilarity(toFnord(tc.a), toFnord(tc.b))
		if got != tc.want {
			t.Errorf("wordSimilarity(%q, %q): want %v, got %v", tc.a, tc.b, tc.want, got)
		}
	}
}
