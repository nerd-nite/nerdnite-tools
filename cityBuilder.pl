use strict;
use diagnostics;
use Term::Prompt;
use Data::Dumper;
use NerdNite::Email;
use Underscore;
use Cwd;

$| = 1;
my $startDir = getcwd;
print "Loading current email addresses...";
my $emailChecker = NerdNite::Email->new();
my $currentEmails = $emailChecker->getAllEmails();
print "done\n\n";

my $cityName = prompt "x", "What is the name of the new city?", "", "";
my $citySlug = lc $cityName;
$citySlug =~ tr/-a-z//cds;
$citySlug = prompt "x", "How should the city appear in the url?", "", $citySlug;

my @bosses;
while(prompt "y", "Do you want to add a boss?" ,"", "") {
    my $bossName = prompt "x", "What is this bosses name", "", "";
    my $nnEmail;
    do {
      $nnEmail = prompt "x", "What email address should they have?", 'Just the part before @nerdnite.com', "";
    } while(_->contains($currentEmails,"$nnEmail\@nerdnite.com" ));

    my $external = prompt "x", "What is their current email address?", "","";
    my $type     = prompt "e", "(M)ailbox or (F)orwarder?", "M or F", "F", '([Ff]|[Mm])';

    push @bosses, {
        name        => $bossName,
        nnuser      => $nnEmail,
        nnemail     => "$nnEmail\@nerdnite.com",
        external    => $external,
        type        => $type
    };
}

print "\n\n";
print "Preparing to build city\n";
print "Site:       Nerd Nite $cityName\n";
print "URL:        http://$citySlug.nerdnite.com\n";
print "City Email: $citySlug\@nerdnite.com\n\n";

print "Bosses\n------\n";

print "Creating Bosses...\n";
for my $boss (@bosses) {
    print "\tAdding $boss->{name}...";
    my $command = "./create_boss.pl $boss->{nnuser} $boss->{external} $boss->{type} 1";
    print STDERR "\n\tCommand: $command\n";

    print "\tdone\n";
}
print "done\n";

print "Connecting Bosses to city email...\n";
for my $boss (@bosses) {
    print "\tConnecting $boss->{name}...";
    my $command = "./addBossToCity.pl $citySlug $boss->{nnuser}";
    print STDERR "\n\tCommand: $command\n";

    print "\tdone\n";
}
print "done\n";

print 'Adding Bosses to bosses@nerdnite.com...';
my $command = "./syncBosses.pl";
print STDERR "\nCommand: $command\n";
print "done\n";

print "Changing dir to www\n";
chdir '..\www';
print "Creating Nerd Nite $cityName site...";
$command = "wp blog create --slug=$citySlug --title=\"Nerd Nite $cityName\" --email=$citySlug\@nerdnite.com";
print STDERR "\nCommand: $command\n";
print "done\n";

print "Adding Bosses to Nerd Nite $cityName...";
for my $boss (@bosses) {
    print "\tAdding $boss->{name}...\n";

    my $command = "wp user create $boss->{nnuser} $boss->{nnuser}\@nerdnite.com --role=city_boss --display_name=\"$boss->{name}\"";
    print STDERR "\tCommand: $command\n";
    $command = "wp user set-role $boss->{nnuser} administrator --url=$citySlug.nerdnite.com";
    print STDERR "\tCommand: $command\n";

    print "\tdone\n";
}
print "done\n";
print "Returning to $startDir\n";
chdir $startDir;