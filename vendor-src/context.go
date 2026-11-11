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
	"math"
	"strings"
	"unicode/utf8"
)

type context struct {
	contextSize           int
	sensitivityThreshold  float64
	excludeProperNames    bool
	wit                   WordIterator
	twoSigmaSqrReciprocal float64
	queue                 []*queueElem
}

type queueElem struct {
	word        WordDescriptor
	wordStr     string
	fnord       fnord
	sepWeight   int
	newSentence bool
	proper      bool
}

type fnord struct {
	lnum   []int
	lindex []int
}

const simChStride = 64

var simCh = []int{
	/* б  в  г  д  е  ж  з  и  й  к  л  м  н  о  п  р  с  т  у  ф  х  ц  ч  ш  щ  ъ  ы  ь  э  ю  я  .  ё */
	9, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 2, 0, 1, /* а */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 9, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* б */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 1, 9, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* в */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 1, 9, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* г */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 9, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* д */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 0, 0, 0, 0, 9, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 1, 1, 0, 9, /* е */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 3, 0, 0, 9, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, /* ж */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 1, 0, 3, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 0, 3, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, /* з */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 0, 0, 0, 0, 2, 0, 0, 9, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 1, 1, 0, 2, /* и */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 2, 9, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* й */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* к */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 9, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* л */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 9, 3, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* м */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 3, 9, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* н */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	2, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, /* о */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* п */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 9, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* р */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 1, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 1, 0, 0, 0, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* с */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 3, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 9, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* т */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 2, 1, 0, 1, /* у */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* ф */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 9, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* х */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 1, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* ц */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 9, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, /* ч */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 9, 3, 0, 0, 0, 0, 0, 0, 0, 0, /* ш */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 9, 0, 0, 0, 0, 0, 0, 0, 0, /* щ */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 0, 3, 0, 0, 0, 0, 0, /* ъ */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 9, 0, 1, 1, 1, 0, 1, /* ы */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 9, 0, 0, 0, 0, 0, /* ь */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 9, 1, 1, 0, 2, /* э */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 9, 1, 0, 1, /* ю */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	2, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 9, 0, 1, /* я */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, /* . */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 0, 0, 0, 0, 9, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 1, 1, 0, 9, /* ё */
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	/* б  в  г  д  е  ж  з  и  й  к  л  м  н  о  п  р  с  т  у  ф  х  ц  ч  ш  щ  ъ  ы  ь  э  ю  я  .  ё */
}

const infLettersStride = 2

var infLetters = []int{
	802, 959, // а
	1232, 1129, // б
	944, 859, // в
	1253, 1193, // г
	1064, 951, // д
	759, 1232, // е
	1432, 1432, // ж
	1193, 993, // з
	802, 767, // и
	1329, 1993, // й
	1032, 929, // к
	967, 1276, // л
	1053, 944, // м
	848, 711, // н
	695, 853, // о
	1088, 454, // п
	929, 1115, // р
	895, 793, // с
	848, 1002, // т
	1115, 1129, // у
	1793, 1022, // ф
	1259, 1329, // х
	1593, 1393, // ц
	1276, 1212, // ч
	1476, 1012, // ш
	1676, 1676, // щ
	1993, 3986, // ъ
	1193, 3986, // ы
	1253, 3986, // ь
	1676, 1232, // э
	1476, 1793, // ю
	1159, 967, // я
	0, 0,
	1300, 1900, // ё
}

var exceptions = map[string]bool{
	"белым бело":          true,
	"более больше":        true,
	"больше более":        true,
	"больше больше":       true,
	"больше меньше":       true,
	"бы бы":               true,
	"бы был":              true,
	"бы была":             true,
	"бы были":             true,
	"бы было":             true,
	"бы вы":               true,
	"была бы":             true,
	"был бы":              true,
	"были бы":             true,
	"было бы":             true,
	"вины виноватый":      true,
	"волей неволей":       true,
	"вот вот":             true,
	"время времени":       true,
	"всего навсего":       true,
	"вы бы":               true,
	"даже уже":            true,
	"друг друга":          true,
	"друг друге":          true,
	"друг другом":         true,
	"друг другу":          true,
	"дурак дураком":       true,
	"если если":           true,
	"звонка звонка":       true,
	"или или":             true,
	"как так":             true,
	"конце концов":        true,
	"корки корки":         true,
	"кто что":             true,
	"либо либо":           true,
	"мало помалу":         true,
	"меньше больше":       true,
	"начать сначала":      true,
	"него нет":            true,
	"не на":               true,
	"не не":               true,
	"не ни":               true,
	"ни на":               true,
	"ни не":               true,
	"ни ни":               true,
	"новые новые":         true,
	"но на":               true,
	"но не":               true,
	"но ни":               true,
	"объять необъятное":   true,
	"одному тому":         true,
	"полным полно":        true,
	"постольку поскольку": true,
	"так как":             true,
	"тем чем":             true,
	"тогда когда":         true,
	"то то":               true,
	"ха ха":               true,
	"чем тем":             true,
	"что то":              true,
	"чуть чуть":           true,
	"шаг шагом":           true,
	"этой что":            true,
	"этот что":            true,
}

var exc2 = map[string]bool{}

func init() {
	for k := range exceptions {
		exc2[strings.Split(k, " ")[1]] = true
	}
}

func fmin(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func fmax(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

func isTitle(s string) bool {
	if len(s) < 4 {
		return false
	}
	r, _ := utf8.DecodeRuneInString(s)
	if !(r >= 'А' && r <= 'Я' || r == 'Ё') {
		return false
	}
	r, _ = utf8.DecodeRuneInString(s[2:])
	return r >= 'а' && r <= 'я' || r == 'ё'
}

func implen(x int) float64 {
	if x == 2 {
		return 5
	}
	y := float64(x)
	return y - ((y - 1) * (y - 1) / 36) + (4.1 / y)
}

func toFnord(w string) fnord {
	lnum := make([]int, 0, len(w))
	for _, r := range w {
		lnum = append(lnum, int(r-'а'))
	}
	lindex := make([]int, 34)
	for i := len(lnum) - 1; i >= 0; i-- {
		lindex[lnum[i]] = i + 1
	}
	return fnord{lnum, lindex}
}

func weighSep(sep string, parStart bool) (int, bool) {
	weight := 0
	if parStart {
		weight = 8
	}
	seenSpace := false
	newSentence := parStart
	for _, r := range sep {
		switch r {
		case ' ', ' ':
			if !seenSpace {
				weight++
				seenSpace = true
			}
		case ',', '/':
			weight += 2
		case '.', '?', '!':
			weight += 4
			newSentence = true
		case '(', ')', '[', ']', '<', '>':
			weight += 3
		case '"', '\\', '«', '»', '“', '”', '„':
			weight += 3
			newSentence = true
		case '—', '–':
			weight += 3
		case '-':
			weight++
			if seenSpace {
				weight += 2
			}
		default:
			// weight+=2
		}
	}
	return weight, newSentence
}

func inforSameDiff(ca, cb fnord) [2]float64 {
	countSame, resSame := 0, 0
	countDiff, resDiff := 0, 0
	a, b := ca.lnum, cb.lnum
	indexInA, indexInB := ca.lindex, cb.lindex

	var p int
	for i, v := range a {
		if bp := indexInB[v]; bp == 0 {
			if i == 0 {
				p = infLetters[v*infLettersStride+1]
			} else {
				p = infLetters[v*infLettersStride]
			}
			resDiff += p
			countDiff++
		} else {
			if i == 0 && bp == 1 {
				p = infLetters[v*infLettersStride+1]
			} else {
				p = infLetters[v*infLettersStride]
			}
			resSame += p
			countSame++
		}
	}

	for i, v := range b {
		if ba := indexInA[v]; ba == 0 {
			if i == 0 {
				p = infLetters[v*infLettersStride+1]
			} else {
				p = infLetters[v*infLettersStride]
			}
			resDiff += p
			countDiff++
		}
	}

	same := 0.
	if countSame != 0 {
		same = float64(resSame) / float64(countSame)
	}

	return [2]float64{same, float64(resDiff)}
}

func wordSimilarity(ca, cb fnord) float64 {
	if len(ca.lnum) > len(cb.lnum) {
		ca, cb = cb, ca
	}
	const dissimilarityThreshold = 24000
	inforSameDiffValue := inforSameDiff(ca, cb)
	if inforSameDiffValue[1] >= dissimilarityThreshold {
		return 0
	}
	a, b := ca.lnum, cb.lnum

	rp3Alen := 1 / (3 * float64(len(a)))
	rp3BLen := 1 / (3 * float64(len(b)))
	k1 := float64(len(a)+len(b))*3/8 + 1
	k2 := fmin(k1, float64(len(a)))

	result := 0.
	maxq := make([]float64, len(a)+1)
	for i0 := range a {
		for j0 := range b {
			p := 0
			k3 := (1 - float64(i0)*rp3Alen) * (1 - float64(j0)*rp3BLen)
			for i, j, partlen := i0, j0, 1; i < len(a) && j < len(b); {
				p += simCh[a[i]*simChStride+b[j]]
				q := float64(p) * k3
				if dist := len(a) - (i + partlen) + j; dist < 2 {
					q *= 1 + (2-float64(dist))*0.333
				}
				maxq[partlen] = fmax(maxq[partlen], q)
				i++
				j++
				partlen++
			}
		}
	}
	for partlen, m := range maxq {
		if m > 6*float64(partlen) {
			result += m * (1 + (float64(partlen)-k2)/(2*k1))
		}
	}

	result *= inforSameDiffValue[0] / (float64(len(a)*(len(a)+1)) * 4.5)

	result *= (dissimilarityThreshold - inforSameDiffValue[1]) / dissimilarityThreshold

	result *= 1 - float64(len(b)-len(a))/(2*float64(len(b)))

	result *= float64(len(a)*len(b)) / (implen(len(a)) * implen(len(b)))

	return result
}

func (c *context) shift() bool {
	if !c.wit.Next() {
		return false
	}

	sepWeight, newSentence := weighSep(c.wit.Sep(), c.wit.ParagraphStart())
	word := strings.ToLower(c.wit.Word())
	if len(c.queue) > c.contextSize {
		copy(c.queue, c.queue[1:])
		c.queue = c.queue[:len(c.queue)-1]
	}
	c.queue = append(c.queue, &queueElem{
		proper:      !newSentence && isTitle(c.wit.Word()),
		word:        c.wit.Descriptor(),
		wordStr:     word,
		fnord:       toFnord(word),
		sepWeight:   sepWeight,
		newSentence: newSentence,
	})
	return true
}

func (c *context) check() []BadPair {
	cur := c.queue[len(c.queue)-1]
	if c.excludeProperNames && cur.proper {
		return nil
	}
	checkExc := exc2[cur.wordStr]
	var badPairs []BadPair
	for i := 0; i < len(c.queue)-1; i++ {
		other := c.queue[i]
		if c.excludeProperNames && other.proper {
			continue
		}
		if checkExc && exceptions[other.wordStr+" "+cur.wordStr] {
			continue
		}
		sim := wordSimilarity(other.fnord, cur.fnord)
		dist := 0.
		for j, n := i+1, len(c.queue); j < n; j++ {
			dist += float64(c.queue[j].sepWeight)
			if j < n-1 {
				dist += float64(len(c.queue[j].fnord.lnum))*0.333 + 1
			}
		}
		dal := math.Exp(-dist * dist * c.twoSigmaSqrReciprocal)
		badness := sim * dal
		if badness <= c.sensitivityThreshold {
			continue
		}
		badPairs = append(badPairs, BadPair{
			Badness: badness,
			First:   other.word,
			Second:  cur.word,
		})
	}
	return badPairs
}

// Check returns a slice of bad word pairs.
func Check(it WordIterator, options ...option) []BadPair {
	ctx := &context{
		wit:                  it,
		contextSize:          defaultContextSize,
		sensitivityThreshold: defaultSensitivityThreshold,
		excludeProperNames:   defaultExcludeProperNames,
	}
	for _, o := range options {
		o(ctx)
	}
	ctx.twoSigmaSqrReciprocal = 1 / (2 * math.Pow(float64(ctx.contextSize)*4, 2))

	var badPairs []BadPair
	for ctx.shift() {
		badPairs = append(badPairs, ctx.check()...)
	}
	return badPairs
}
