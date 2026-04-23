package validate

import (
	"regexp"
	"strings"
)

var phoneRe = regexp.MustCompile(`^\+?[1-9]\d{7,14}$`)

func NormalizePhone(raw string) (string, bool) {
	clean := strings.NewReplacer(" ", "", "-", "", "(", "", ")", "").Replace(raw)
	if !phoneRe.MatchString(clean) {
		return "", false
	}
	return clean, true
}
